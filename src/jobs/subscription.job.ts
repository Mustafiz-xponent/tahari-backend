import cron from "node-cron";
import prisma from "@/prisma-client/prismaClient";
// import { notifyAdmin, notifyCustomer } from "@/lib/notifications";
import logger from "@/utils/logger";
import { addWeeks, addMonths } from "date-fns";
import * as notificationService from "@/modules/notifications/notification.service";
import * as orderItemService from "@/modules/order_items/order-item.service";

type SubscriptionWithRelations = {
  subscriptionId: bigint;
  paymentMethod: "WALLET" | "COD";
  shippingAddress: string;
  customer: CustomerWithWallet;
  subscriptionPlan: {
    price: number;
    frequency: "WEEKLY" | "MONTHLY";
    productId: bigint;
  };
};

type CustomerWithWallet = {
  customerId: bigint;
  userId: bigint;
  wallet?: {
    walletId: bigint;
    balance: number;
    lockedBalance: number;
  };
};

const BATCH_SIZE = 100; // Number of subscriptions to process at once to avoid db overload
const TIMEZONE = process.env.TIME_ZONE || "Asia/Dhaka";
const CRON_SCHEDULE = process.env.SUBSCRIPTION_CRON_SCHEDULE || "0 2 * * *"; // Every day at 2am

/**
 * Runs the full subscription renewal batch job.
 */
export async function renewSubscriptions(today: Date = new Date()) {
  try {
    logger.info(`Starting subscription renewal for ${today.toISOString()}`);

    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const dueSubscriptions = await prisma.subscription.findMany({
        where: {
          status: "ACTIVE",
          renewalDate: { lte: today },
          isProcessing: false,
        },
        include: {
          customer: { include: { wallet: true } },
          subscriptionPlan: true,
        },
        take: BATCH_SIZE,
        skip,
        orderBy: { renewalDate: "asc" },
      });

      if (dueSubscriptions.length === 0) {
        hasMore = false;
        break;
      }

      await Promise.all(
        dueSubscriptions.map(async (subscription: any) => {
          try {
            await prisma.subscription.update({
              where: { subscriptionId: subscription.subscriptionId },
              data: { isProcessing: true },
            });

            await processSingleSubscription(subscription, today);
          } catch (error) {
            logger.error(
              `Failed to process subscription ${subscription.subscriptionId}:`,
              error
            );

            await prisma.subscription.update({
              where: { subscriptionId: subscription.subscriptionId },
              data: { isProcessing: false },
            });
          }
        })
      );

      skip += BATCH_SIZE;
    }

    logger.info(`Subscription renewal batch completed.`);
  } catch (error) {
    logger.error("Critical error in subscription renewal:", error);
    throw error;
  }
}

/**
 * Processes a single subscription's renewal logic.
 */
async function processSingleSubscription(
  subscription: SubscriptionWithRelations,
  today: Date
) {
  const { customer, subscriptionPlan, paymentMethod } = subscription;

  if (paymentMethod === "WALLET") {
    if (!customer.wallet) {
      throw new Error(`Wallet not found for customer ${customer.customerId}`);
    }
    await handleWalletPayment(
      subscription,
      customer,
      subscriptionPlan.price,
      today
    );
  } else if (paymentMethod === "COD") {
    await handleCODPayment(
      subscription,
      customer,
      subscriptionPlan.price,
      today
    );
  } else {
    throw new Error(`Unsupported payment method: ${paymentMethod}`);
  }
}

/**
 * Handles subscription renewal with WALLET payment.
 */
async function handleWalletPayment(
  subscription: SubscriptionWithRelations,
  customer: CustomerWithWallet,
  price: number,
  today: Date
) {
  const wallet = customer.wallet!;
  const availableLocked = wallet.lockedBalance;

  if (availableLocked < price) {
    await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { subscriptionId: subscription.subscriptionId },
        data: { status: "PAUSED", isProcessing: false },
      });

      logger.warn(
        `Subscription ${subscription.subscriptionId} paused due to insufficient locked balance.`
      );

      const notificationMsg =
        "আপনার সাবস্ক্রিপশন পর্যাপ্ত ওয়ালেট ব্যালেন্সের অভাবে সাময়িকভাবে বন্ধ হয়েছে। অনুগ্রহ করে রিচার্জ করুন।";
      await notificationService.createNotification({
        message: notificationMsg.replace(/\s+/g, " ").trim(),
        receiverId: customer.userId,
        type: "SUBSCRIPTION",
      });
    });
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Find product
    const product = await tx.product.findUnique({
      where: { productId: subscription.subscriptionPlan.productId },
    });
    // Validate product
    if (!product) {
      throw new Error(
        `Product not found for subscription ${subscription.subscriptionId}`
      );
    }
    // Deduct amount from wallet balance and locked balance
    await tx.wallet.update({
      where: { walletId: Number(wallet.walletId) },
      data: {
        lockedBalance: { decrement: price },
        balance: { decrement: price },
      },
    });
    // Create wallet transaction
    const walletTransaction = await tx.walletTransaction.create({
      data: {
        amount: price,
        transactionType: "PURCHASE",
        transactionStatus: "COMPLETED",
        description: `Subscription renewal for #${subscription.subscriptionId}`,
        walletId: Number(wallet.walletId),
      },
    });

    // Create order
    const order = await tx.order.create({
      data: {
        status: "CONFIRMED",
        paymentStatus: "COMPLETED",
        paymentMethod: "WALLET",
        totalAmount: price,
        isSubscription: true,
        customerId: Number(customer.customerId),
        shippingAddress: subscription.shippingAddress,
      },
      include: { orderItems: true },
    });
    // Create order items
    await orderItemService.createOrderItem({
      quantity: 1, // Assuming 1 item per order for subscriptions
      unitPrice: Number(product.unitPrice),
      unitType: product.unitType,
      packageSize: product.packageSize,
      subtotal: Number(product.unitPrice) * Number(product.packageSize) * 1, // 1 differs quantity
      orderId: order.orderId,
      productId: product.productId,
    });

    // Track the order update
    await tx.orderTracking.create({
      data: {
        orderId: order.orderId,
        status: "CONFIRMED",
        description: "Order confirmed and payment completed via wallet",
      },
    });

    // Create payment record
    await tx.payment.create({
      data: {
        amount: order.totalAmount,
        paymentMethod: "WALLET",
        paymentStatus: "COMPLETED",
        orderId: order.orderId,
        transactionId: `ORDER_${order.orderId}_${Date.now()}`,
        walletTransactionId: walletTransaction.transactionId,
      },
    });
    // Decrement product stock
    await tx.product.update({
      where: { productId: product.productId },
      data: {
        stockQuantity: {
          decrement: 1 * product.packageSize, // Assuming 1 item per order for subscriptions
        },
      },
    });

    // Create stock transaction record
    await tx.stockTransaction.create({
      data: {
        quantity: 1 * product.packageSize, // Assuming 1 item per order for subscriptions
        transactionType: "OUT",
        productId: product.productId,
        orderId: order.orderId,
        description: `Stock reduced for Order #${order.orderId}`,
      },
    });
    // Create subscription delivery record
    await tx.subscriptionDelivery.create({
      data: {
        deliveryDate: today,
        status: "PROCESSING",
        subscriptionId: subscription.subscriptionId,
        orderId: order.orderId,
      },
    });
    // Calculate next renewal date
    const nextRenewal = calculateNextRenewal(
      today,
      subscription.subscriptionPlan.frequency
    );
    // Lock the amount for next delivery
    const nextLockedBalance = wallet.balance - price >= price;
    if (nextLockedBalance) {
      await tx.wallet.update({
        where: { walletId: Number(wallet.walletId) },
        data: { lockedBalance: { increment: price } },
      });
    } else {
      // Due to insufficient funds, pause the subscription
      await tx.subscription.update({
        where: { subscriptionId: subscription.subscriptionId },
        data: { status: "PAUSED" },
      });
      // Notify the customer
      const notificationMsg =
        "পরবর্তী সাবস্ক্রিপশন পরিশোধের জন্য পর্যাপ্ত ব্যালেন্স নেই, অনুগ্রহ করে ওয়ালেট রিচার্জ করুন।";
      await notificationService.createNotification({
        message: notificationMsg.replace(/\s+/g, " ").trim(),
        receiverId: customer.userId,
        type: "SUBSCRIPTION",
      });
      logger.warn(
        `Subscription ${subscription.subscriptionId} paused due to insufficient funds for next cycle.`
      );
    }
    // If sufficient funds, update subscription for next delivery
    await tx.subscription.update({
      where: { subscriptionId: subscription.subscriptionId },
      data: {
        renewalDate: nextRenewal,
        isProcessing: false,
      },
    });

    // Notify the customer
    const notificationMsg = `আপনার সাবস্ক্রিপশন সফলভাবে রিনিউ হয়েছে। পরবর্তী ডেলিভারি: ${nextRenewal.toDateString()}.`;
    await notificationService.createNotification({
      message: notificationMsg.replace(/\s+/g, " ").trim(),
      receiverId: customer.userId,
      type: "SUBSCRIPTION",
    });

    logger.info(
      `Renewed subscription ${subscription.subscriptionId} with WALLET.`
    );
  });
}

/**
 * Handles subscription renewal with COD payment.
 */
async function handleCODPayment(
  subscription: SubscriptionWithRelations,
  customer: CustomerWithWallet,
  price: number,
  today: Date
) {
  await prisma.$transaction(async (tx) => {
    // Find product
    const product = await tx.product.findUnique({
      where: { productId: subscription.subscriptionPlan.productId },
    });
    // Validate product
    if (!product) {
      throw new Error(
        `Product not found for subscription ${subscription.subscriptionId}`
      );
    }
    // Create order
    const order = await tx.order.create({
      data: {
        status: "CONFIRMED",
        paymentStatus: "PENDING",
        paymentMethod: "COD",
        totalAmount: price,
        isSubscription: true,
        customerId: Number(customer.customerId),
        shippingAddress: subscription.shippingAddress,
      },
    });
    // Create order items
    await orderItemService.createOrderItem({
      quantity: 1, // Assuming 1 item per order for subscriptions
      unitPrice: Number(product.unitPrice),
      unitType: product.unitType,
      packageSize: product.packageSize,
      subtotal: Number(product.unitPrice) * Number(product.packageSize) * 1, // 1 differs quantity
      orderId: order.orderId,
      productId: product.productId,
    });
    // Create subscription delivery record
    await tx.subscriptionDelivery.create({
      data: {
        deliveryDate: today,
        status: "PROCESSING",
        subscriptionId: subscription.subscriptionId,
        orderId: order.orderId,
      },
    });
    // Create a pending payment record
    await tx.payment.create({
      data: {
        amount: order.totalAmount,
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        orderId: order.orderId,
        transactionId: `ORDER_${order.orderId}_${Date.now()}`,
      },
    });
    // Track the order update
    await tx.orderTracking.create({
      data: {
        orderId: Number(order.orderId),
        status: "CONFIRMED",
        description:
          "Order created and confirmed. payment pending for Cash on Delivery",
      },
    });
    // Calculate next renewal date
    const nextRenewal = calculateNextRenewal(
      today,
      subscription.subscriptionPlan.frequency
    );
    // Update subscription for next delivery
    await tx.subscription.update({
      where: { subscriptionId: subscription.subscriptionId },
      data: {
        renewalDate: nextRenewal,
        isProcessing: false,
      },
    });

    // Notify the customer
    const notificationMsg = `আপনার সাবস্ক্রিপশন ডেলিভারি নির্ধারিত হয়েছে। দয়া করে পণ্য গ্রহণের সময় পেমেন্ট করুন।`;
    await notificationService.createNotification({
      message: notificationMsg.replace(/\s+/g, " ").trim(),
      receiverId: customer.userId,
      type: "SUBSCRIPTION",
    });

    logger.info(
      `Renewed subscription ${subscription.subscriptionId} with COD.`
    );
  });
}

/**
 * Utility to calculate next renewal date.
 */
function calculateNextRenewal(
  currentDate: Date,
  frequency: "WEEKLY" | "MONTHLY"
): Date {
  switch (frequency) {
    case "WEEKLY":
      return addWeeks(currentDate, 1); // Adds exactly 7 days
    case "MONTHLY":
      return addMonths(currentDate, 1); // Handles month boundaries (e.g., Jan 31 → Feb 28/29)
    default:
      throw new Error(`Invalid frequency: ${frequency}`);
  }
}
/**
 * Start the cron job.
 */
export function startSubscriptionRenewalJob() {
  cron.schedule(
    CRON_SCHEDULE,
    async () => {
      try {
        await renewSubscriptions();
      } catch (error) {
        logger.error("Subscription cron failed:", error);
        // TODO: send notification to admin if needed
      }
    },
    {
      timezone: TIMEZONE,
    }
  );
}
