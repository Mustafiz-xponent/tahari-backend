import cron from "node-cron";
import prisma from "@/prisma-client/prismaClient";
import logger from "@/utils/logger";
import { addWeeks, addMonths, nextSaturday, startOfMonth } from "date-fns";
import * as notificationService from "@/modules/notifications/notification.service";
import * as orderItemService from "@/modules/order_items/order-item.service";
import { Prisma } from "@prisma/client";
import { Order, Product } from "@/generated/prisma/client";
import { Decimal } from "@/generated/prisma/client/runtime/library";

// Types
type SubscriptionWithRelations = {
  subscriptionId: bigint;
  paymentMethod: string;
  shippingAddress: string;
  customer: CustomerWithWallet;
  subscriptionPlan: {
    price: Decimal;
    frequency: "WEEKLY" | "MONTHLY";
    productId: bigint;
  };
};

type CustomerWithWallet = {
  customerId: bigint;
  userId: bigint;
  wallet: {
    walletId: bigint;
    balance: Decimal;
    lockedBalance: Decimal;
    customerId: bigint;
  } | null;
};

type ProcessingResult = {
  success: boolean;
  subscriptionId: bigint;
  error?: Error;
};

// Configuration
const CONFIG = {
  BATCH_SIZE: 100, // Number of subscriptions to process per batch
  TIMEZONE: process.env.TIME_ZONE || "Asia/Dhaka",
  CRON_SCHEDULE: process.env.SUBSCRIPTION_CRON_SCHEDULE || "0 2 * * *", // Run at 2 AM
  MAX_RETRIES: 3,
  CONCURRENT_BATCHES: 5, // Process multiple batches concurrently
} as const;

// Utility functions
const calculateNextRenewal =
  (currentDate: Date) =>
  (frequency: "WEEKLY" | "MONTHLY"): Date => {
    const calculators = {
      WEEKLY: () => addWeeks(currentDate, 1),
      MONTHLY: () => addMonths(currentDate, 1),
    };

    const calculator = calculators[frequency];
    if (!calculator) throw new Error(`Invalid frequency: ${frequency}`);

    return calculator();
  };

const getNextDeliveryDate =
  (currentDate: Date) =>
  (frequency: "WEEKLY" | "MONTHLY"): Date => {
    const deliveryDates = {
      WEEKLY: () => nextSaturday(currentDate),
      MONTHLY: () => startOfMonth(addMonths(currentDate, 1)),
    };

    const getDate = deliveryDates[frequency];
    if (!getDate) throw new Error(`Invalid frequency: ${frequency}`);

    return getDate();
  };

const hasInsufficientStock = (
  product: Product,
  quantity: number = 1
): boolean => product.packageSize * quantity > product.stockQuantity;

const hasInsufficientWalletBalance = (wallet: any, price: Decimal): boolean =>
  wallet.lockedBalance.toNumber() < price.toNumber();

const canLockNextPayment = (wallet: any, price: Decimal): boolean =>
  wallet.balance.toNumber() - price.toNumber() >= price.toNumber();

// Database operations (pure functions that return operations)
const createNotification = (message: string, receiverId: bigint) =>
  notificationService.createNotification({
    message: message.replace(/\s+/g, " ").trim(),
    receiverId,
    type: "SUBSCRIPTION",
  });

const pauseSubscription = (
  subscriptionId: bigint,
  tx: Prisma.TransactionClient
) =>
  tx.subscription.update({
    where: { subscriptionId },
    data: { status: "PAUSED", isProcessing: false },
  });

const updateSubscriptionProcessing = (
  subscriptionId: bigint,
  isProcessing: boolean
) =>
  prisma.subscription.update({
    where: { subscriptionId },
    data: { isProcessing },
  });

// Batch processing functions
const fetchSubscriptionBatch = async (
  skip: number,
  batchSize: number,
  today: Date
) => {
  return prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      renewalDate: { lte: today },
      isProcessing: false,
    },
    include: {
      customer: {
        include: {
          wallet: {
            select: {
              walletId: true,
              balance: true,
              lockedBalance: true,
              customerId: true,
            },
          },
        },
      },
      subscriptionPlan: {
        select: {
          price: true,
          frequency: true,
          productId: true,
        },
      },
    },
    take: batchSize,
    skip,
    orderBy: { renewalDate: "asc" },
  });
};

const processSubscriptionBatch = async (
  subscriptions: SubscriptionWithRelations[],
  today: Date
): Promise<ProcessingResult[]> => {
  const processWithRetry = async (
    subscription: SubscriptionWithRelations,
    retries = 0
  ): Promise<ProcessingResult> => {
    try {
      await updateSubscriptionProcessing(subscription.subscriptionId, true);
      await processSingleSubscription(subscription, today);

      return {
        success: true,
        subscriptionId: subscription.subscriptionId,
      };
    } catch (error) {
      if (retries < CONFIG.MAX_RETRIES) {
        logger.warn(
          `Retrying subscription ${subscription.subscriptionId}, attempt ${
            retries + 1
          }`
        );
        return processWithRetry(subscription, retries + 1);
      }

      await updateSubscriptionProcessing(subscription.subscriptionId, false);

      return {
        success: false,
        subscriptionId: subscription.subscriptionId,
        error: error as Error,
      };
    }
  };

  return Promise.allSettled(
    subscriptions.map((subscription) => processWithRetry(subscription))
  ).then((results) =>
    results.map((result) =>
      result.status === "fulfilled"
        ? result.value
        : {
            success: false,
            subscriptionId: BigInt(0),
            error: new Error("Promise rejected"),
          }
    )
  );
};

// Main processing functions
const processSingleSubscription = async (
  subscription: SubscriptionWithRelations,
  today: Date
): Promise<void> => {
  const paymentMethod = subscription.paymentMethod as "COD" | "WALLET";

  const processors = {
    WALLET: () => handleWalletPayment(subscription, today),
    COD: () => handleCODPayment(subscription, today),
  };

  const processor = processors[paymentMethod];
  if (!processor) {
    throw new Error(`Unsupported payment method: ${paymentMethod}`);
  }

  await processor();
};

const handleWalletPayment = async (
  subscription: SubscriptionWithRelations,
  today: Date
): Promise<void> => {
  const { customer, subscriptionPlan } = subscription;
  const { price } = subscriptionPlan;

  if (!customer.wallet) {
    throw new Error(`Wallet not found for customer ${customer.customerId}`);
  }

  if (hasInsufficientWalletBalance(customer.wallet, price)) {
    await pauseAndNotifyInsufficientBalance(subscription, customer);
    return;
  }

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { productId: subscription.subscriptionPlan.productId },
    });

    if (!product) {
      throw new Error(
        `Product not found for subscription ${subscription.subscriptionId}`
      );
    }

    if (hasInsufficientStock(product)) {
      await pauseAndNotifyInsufficientStock(subscription, customer, tx);
      return;
    }

    await processWalletPaymentTransaction(
      subscription,
      customer,
      product,
      price,
      today,
      tx
    );
  });
};

const handleCODPayment = async (
  subscription: SubscriptionWithRelations,
  today: Date
): Promise<void> => {
  const { customer, subscriptionPlan } = subscription;
  const { price } = subscriptionPlan;

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { productId: subscription.subscriptionPlan.productId },
    });

    if (!product) {
      throw new Error(
        `Product not found for subscription ${subscription.subscriptionId}`
      );
    }

    if (hasInsufficientStock(product)) {
      await pauseAndNotifyInsufficientStock(subscription, customer, tx);
      return;
    }

    await processCODPaymentTransaction(
      subscription,
      customer,
      product,
      price,
      today,
      tx
    );
  });
};

// Transaction processing functions
const processWalletPaymentTransaction = async (
  subscription: SubscriptionWithRelations,
  customer: CustomerWithWallet,
  product: Product,
  price: Decimal,
  today: Date,
  tx: Prisma.TransactionClient
): Promise<void> => {
  const wallet = customer.wallet!;

  // Update wallet balance
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

  // Create order and related records
  const order = await createOrderWithItems(
    subscription,
    customer,
    product,
    price,
    "WALLET",
    tx
  );

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

  // Update product stock
  await updateProductStock(product, tx, order.orderId);

  // Create subscription delivery
  await createSubscriptionDelivery(subscription, order, today, tx);

  // Handle next payment cycle
  await handleNextPaymentCycle(subscription, customer, price, today, tx);

  // Notify customer
  const nextRenewal = calculateNextRenewal(today)(
    subscription.subscriptionPlan.frequency
  );
  await createNotification(
    `আপনার সাবস্ক্রিপশন সফলভাবে রিনিউ হয়েছে। পরবর্তী ডেলিভারি: ${nextRenewal.toDateString()}.`,
    customer.userId
  );

  logger.info(
    `Renewed subscription ${subscription.subscriptionId} with WALLET.`
  );
};

const processCODPaymentTransaction = async (
  subscription: SubscriptionWithRelations,
  customer: CustomerWithWallet,
  product: Product,
  price: Decimal,
  today: Date,
  tx: Prisma.TransactionClient
): Promise<void> => {
  // Create order and related records
  const order = await createOrderWithItems(
    subscription,
    customer,
    product,
    price,
    "COD",
    tx
  );

  // Create pending payment record
  await tx.payment.create({
    data: {
      amount: order.totalAmount,
      paymentMethod: "COD",
      paymentStatus: "PENDING",
      orderId: order.orderId,
      transactionId: `ORDER_${order.orderId}_${Date.now()}`,
    },
  });

  // Create subscription delivery
  await createSubscriptionDelivery(subscription, order, today, tx);

  // Update subscription for next delivery
  const nextRenewal = calculateNextRenewal(today)(
    subscription.subscriptionPlan.frequency
  );
  await tx.subscription.update({
    where: { subscriptionId: subscription.subscriptionId },
    data: {
      renewalDate: nextRenewal,
      isProcessing: false,
    },
  });

  // Notify customer
  await createNotification(
    `আপনার সাবস্ক্রিপশন ডেলিভারি নির্ধারিত হয়েছে। দয়া করে পণ্য গ্রহণের সময় পেমেন্ট করুন।`,
    customer.userId
  );

  logger.info(`Renewed subscription ${subscription.subscriptionId} with COD.`);
};

// Helper functions for transaction processing
const createOrderWithItems = async (
  subscription: SubscriptionWithRelations,
  customer: CustomerWithWallet,
  product: Product,
  price: Decimal,
  paymentMethod: "WALLET" | "COD",
  tx: Prisma.TransactionClient
) => {
  const order = await tx.order.create({
    data: {
      status: "CONFIRMED",
      paymentStatus: paymentMethod === "WALLET" ? "COMPLETED" : "PENDING",
      paymentMethod,
      totalAmount: price,
      isSubscription: true,
      customerId: Number(customer.customerId),
      shippingAddress: subscription.shippingAddress,
    },
  });

  // Create order items
  await orderItemService.createOrderItem({
    quantity: 1,
    unitPrice: Number(product.unitPrice),
    unitType: product.unitType,
    packageSize: product.packageSize,
    subtotal: Number(product.unitPrice) * Number(product.packageSize),
    orderId: order.orderId,
    productId: product.productId,
  });

  // Track the order
  await tx.orderTracking.create({
    data: {
      orderId: order.orderId,
      status: "CONFIRMED",
      description:
        paymentMethod === "WALLET"
          ? "Order confirmed and payment completed via wallet"
          : "Order created and confirmed. payment pending for Cash on Delivery",
    },
  });

  return order;
};

const updateProductStock = async (
  product: Product,
  tx: Prisma.TransactionClient,
  orderId: bigint
) => {
  const quantity = product.packageSize;

  await tx.product.update({
    where: { productId: product.productId },
    data: {
      stockQuantity: { decrement: quantity },
    },
  });

  await tx.stockTransaction.create({
    data: {
      quantity,
      transactionType: "OUT",
      productId: product.productId,
      orderId,
      description: `Stock reduced for Order #${orderId}`,
    },
  });
};

const createSubscriptionDelivery = async (
  subscription: SubscriptionWithRelations,
  order: Order,
  today: Date,
  tx: Prisma.TransactionClient
) => {
  const nextDeliveryDate = getNextDeliveryDate(today)(
    subscription.subscriptionPlan.frequency
  );

  await tx.subscriptionDelivery.create({
    data: {
      deliveryDate: nextDeliveryDate,
      status: "PROCESSING",
      subscriptionId: subscription.subscriptionId,
      orderId: order.orderId,
    },
  });
};

const handleNextPaymentCycle = async (
  subscription: SubscriptionWithRelations,
  customer: CustomerWithWallet,
  price: Decimal,
  today: Date,
  tx: Prisma.TransactionClient
) => {
  const wallet = customer.wallet!;
  const nextRenewal = calculateNextRenewal(today)(
    subscription.subscriptionPlan.frequency
  );

  if (canLockNextPayment(wallet, price)) {
    await tx.wallet.update({
      where: { walletId: Number(wallet.walletId) },
      data: { lockedBalance: { increment: price } },
    });

    await tx.subscription.update({
      where: { subscriptionId: subscription.subscriptionId },
      data: {
        renewalDate: nextRenewal,
        isProcessing: false,
      },
    });
  } else {
    await tx.subscription.update({
      where: { subscriptionId: subscription.subscriptionId },
      data: {
        status: "PAUSED",
        isProcessing: false,
      },
    });

    await createNotification(
      "পরবর্তী সাবস্ক্রিপশন পরিশোধের জন্য পর্যাপ্ত ব্যালেন্স নেই, অনুগ্রহ করে ওয়ালেট রিচার্জ করুন।",
      customer.userId
    );

    logger.warn(
      `Subscription ${subscription.subscriptionId} paused due to insufficient funds for next cycle.`
    );
  }
};

// Notification helper functions
const pauseAndNotifyInsufficientBalance = async (
  subscription: SubscriptionWithRelations,
  customer: CustomerWithWallet
) => {
  await prisma.$transaction(async (tx) => {
    await pauseSubscription(subscription.subscriptionId, tx);

    await createNotification(
      "আপনার সাবস্ক্রিপশন পর্যাপ্ত ওয়ালেট ব্যালেন্সের অভাবে সাময়িকভাবে বন্ধ হয়েছে। অনুগ্রহ করে রিচার্জ করুন।",
      customer.userId
    );
  });

  logger.warn(
    `Subscription ${subscription.subscriptionId} paused due to insufficient locked balance.`
  );
};

const pauseAndNotifyInsufficientStock = async (
  subscription: SubscriptionWithRelations,
  customer: CustomerWithWallet,
  tx: Prisma.TransactionClient
) => {
  await pauseSubscription(subscription.subscriptionId, tx);

  await createNotification(
    `আপনার সাবস্ক্রিপশন সাময়িকভাবে বন্ধ হয়েছে কারণ পণ্যটি স্টকে নেই।`,
    customer.userId
  );

  logger.warn(
    `Subscription ${subscription.subscriptionId} paused due to insufficient stock.`
  );
};

// Main renewal function
export const renewSubscriptions = async (
  today: Date = new Date()
): Promise<void> => {
  logger.info(`Starting subscription renewal for ${today.toISOString()}`);

  const processAllBatches = async (): Promise<void> => {
    let skip = 0;
    let totalProcessed = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;

    while (true) {
      const batches = await Promise.all(
        Array.from({ length: CONFIG.CONCURRENT_BATCHES }, (_, i) =>
          fetchSubscriptionBatch(
            skip + i * CONFIG.BATCH_SIZE,
            CONFIG.BATCH_SIZE,
            today
          )
        )
      );

      const allSubscriptions = batches.flat();

      if (allSubscriptions.length === 0) {
        break;
      }

      // Process batches concurrently
      const batchResults = await Promise.all(
        batches
          .filter((batch) => batch.length > 0)
          .map((batch) => processSubscriptionBatch(batch, today))
      );

      // Collect results
      const results = batchResults.flat();
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      totalProcessed += results.length;
      totalSuccessful += successful;
      totalFailed += failed;

      // Log failed subscriptions
      results
        .filter((r) => !r.success)
        .forEach((r) =>
          logger.error(
            `Failed to process subscription ${r.subscriptionId}:`,
            r.error
          )
        );

      skip += CONFIG.CONCURRENT_BATCHES * CONFIG.BATCH_SIZE;

      logger.info(
        `Processed batch: ${results.length} subscriptions (${successful} successful, ${failed} failed)`
      );
    }

    logger.info(
      `Subscription renewal completed: ${totalProcessed} total, ${totalSuccessful} successful, ${totalFailed} failed`
    );
  };

  try {
    await processAllBatches();
  } catch (error) {
    logger.error("Critical error in subscription renewal:", error);
    throw error;
  }
};

// Cron job starter
export const startSubscriptionRenewalJob = () => {
  cron.schedule(
    CONFIG.CRON_SCHEDULE,
    async () => {
      try {
        await renewSubscriptions();
      } catch (error) {
        logger.error("Subscription cron failed:", error);
        // TODO: send notification to admin if needed
      }
    },
    {
      timezone: CONFIG.TIMEZONE,
    }
  );

  logger.info(
    `Subscription renewal cron job started with schedule: ${CONFIG.CRON_SCHEDULE}`
  );
};
