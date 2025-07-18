import {
  SubscriptionPlanType,
  Order,
  Product,
  Customer,
} from "@/generated/prisma/client";
import { Decimal } from "@/generated/prisma/client/runtime/library";
import {
  addDays,
  addWeeks,
  addMonths,
  isBefore,
  nextSaturday,
  startOfMonth,
} from "date-fns";
import logger from "@/utils/logger";
import * as notificationService from "@/modules/notifications/notification.service";
import { Prisma } from "@prisma/client";
import prisma from "@/prisma-client/prismaClient";

// Types
export type SubscriptionWithRelations = {
  subscriptionId: bigint;
  paymentMethod: string;
  planPrice: Decimal;
  shippingAddress: string;
  customer: CustomerWithWallet;
  subscriptionPlan: {
    price: Decimal;
    frequency: SubscriptionPlanType;
    productId: bigint;
  };
};

export type CustomerWithWallet = {
  customerId: bigint;
  userId: bigint;
  wallet: {
    walletId: bigint;
    balance: Decimal;
    lockedBalance: Decimal;
    customerId: bigint;
  } | null;
};

//  Buffer days for each frequency
const defaultBufferConfig = { WEEKLY: 2, MONTHLY: 2 }; // 2 day buffer before delivery

// Calculate renewal date (always fixed: today + 7 or +30)
export const getNextRenewalDate = (
  currentDate: Date,
  frequency: SubscriptionPlanType
): Date => {
  if (frequency === "MONTHLY") return addMonths(currentDate, 1);
  if (frequency === "WEEKLY") return addWeeks(currentDate, 1);

  throw new Error(`Invalid frequency: ${frequency}`);
};

// Calculate nearest delivery date (e.g., next Saturday or next month's first day)
export const calculateNearestDeliveryDate = (
  currentDate: Date,
  frequency: SubscriptionPlanType
): Date => {
  if (frequency === "WEEKLY") return nextSaturday(currentDate);
  if (frequency === "MONTHLY") return startOfMonth(addMonths(currentDate, 1));

  throw new Error(`Invalid frequency: ${frequency}`);
};

// Determine if purchase is eligible for nearest delivery cycle
export const isEligibleForNearestDelivery = (
  currentDate: Date,
  deliveryDate: Date,
  bufferDays: number
): boolean => {
  const bufferThreshold = addDays(deliveryDate, -bufferDays);
  return isBefore(currentDate, bufferThreshold);
};

// Generate subscription schedule
export const getNextDeliveryDate = (
  currentDate: Date,
  frequency: SubscriptionPlanType
): Date => {
  const bufferDays = { ...defaultBufferConfig }[frequency];

  const nearestDeliveryDate = calculateNearestDeliveryDate(
    currentDate,
    frequency
  );

  const eligibleForCurrentCycle = isEligibleForNearestDelivery(
    currentDate,
    nearestDeliveryDate,
    bufferDays
  );

  const deliveryDate = eligibleForCurrentCycle
    ? nearestDeliveryDate
    : calculateNearestDeliveryDate(addDays(currentDate, 7), frequency);

  return deliveryDate;
};

export const hasInsufficientStock = (
  product: Product,
  quantity: number = 1
): boolean => {
  return product.packageSize * quantity > product.stockQuantity;
};

export const hasInsufficientWalletBalance = (
  wallet: any,
  price: Decimal
): boolean => {
  return wallet.lockedBalance.toNumber() < price.toNumber();
};

export const canLockNextPayment = (wallet: any, price: Decimal): boolean => {
  return wallet.balance.toNumber() - price.toNumber() >= price.toNumber();
};

const createNotification = async (message: string, receiverId: bigint) => {
  await notificationService.createNotification({
    message: message.replace(/\s+/g, " ").trim(),
    receiverId,
    type: "SUBSCRIPTION",
  });
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

const pauseSubscription = async (
  subscriptionId: bigint,
  tx: Prisma.TransactionClient
) => {
  await tx.subscription.update({
    where: { subscriptionId },
    data: { status: "PAUSED", isProcessing: false },
  });
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
export const createOrderWithItems = async (
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
  await tx.orderItem.create({
    data: {
      quantity: 1,
      unitPrice: Number(product.unitPrice),
      unitType: product.unitType,
      packageSize: product.packageSize,
      subtotal: Number(product.unitPrice) * Number(product.packageSize),
      orderId: order.orderId,
      productId: product.productId,
    },
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
const createSubscriptionDelivery = async (
  subscription: SubscriptionWithRelations,
  order: Order,
  today: Date,
  customer: Customer,
  paymentMethod: "WALLET" | "COD",
  tx: Prisma.TransactionClient
) => {
  const frequency = subscription.subscriptionPlan.frequency;
  const nextDeliveryDate = getNextDeliveryDate(today, frequency);

  await tx.subscriptionDelivery.create({
    data: {
      deliveryDate: nextDeliveryDate,
      status: "CONFIRMED",
      subscriptionId: subscription.subscriptionId,
      orderId: order.orderId,
    },
  });
  // Notify customer
  let message = ``;
  if (paymentMethod === "WALLET") {
    message = `আপনার সাবস্ক্রিপশন ডেলিভারি নির্ধারিত হয়েছে।`;
  } else if (paymentMethod === "COD") {
    message = `আপনার সাবস্ক্রিপশন ডেলিভারি নির্ধারিত হয়েছে। দয়া করে পণ্য গ্রহণের সময় পেমেন্ট করুন।`;
  }
  await createNotification(message, customer.userId);
};
const handleRenewalWalletPayment = async (
  subscription: SubscriptionWithRelations,
  customer: CustomerWithWallet,
  price: Decimal,
  today: Date,
  tx: Prisma.TransactionClient
) => {
  const wallet = customer.wallet!;
  const frequency = subscription.subscriptionPlan.frequency;
  const nextRenewal = getNextRenewalDate(today, frequency);

  if (canLockNextPayment(wallet, price)) {
    await tx.wallet.update({
      where: { walletId: Number(wallet.walletId) },
      data: { lockedBalance: { increment: price } },
    });

    await tx.subscription.update({
      where: { subscriptionId: subscription.subscriptionId },
      data: {
        renewalDate: nextRenewal,
        planPrice: price, // update plan price with latest plan price
        isProcessing: false,
      },
    });
    // Notify customer
    const message = `আপনার সাবস্ক্রিপশন সফলভাবে রিনিউ হয়েছে।`;
    await createNotification(message, customer.userId);

    logger.info(
      `Renewed subscription ${subscription.subscriptionId} with WALLET.`
    );
  } else {
    await pauseSubscription(subscription.subscriptionId, tx);
    await createNotification(
      "পরবর্তী সাবস্ক্রিপশন পরিশোধের জন্য পর্যাপ্ত ব্যালেন্স নেই, অনুগ্রহ করে ওয়ালেট রিচার্জ করুন।",
      customer.userId
    );
    logger.warn(
      `Subscription ${subscription.subscriptionId} paused due to insufficient funds for next cycle.`
    );
  }
};
// Main function to handle wallet payment
export const handleWalletPayment = async (
  subscription: SubscriptionWithRelations,
  today: Date
): Promise<void> => {
  const { customer, subscriptionPlan, planPrice: price } = subscription;

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

    const wallet = customer.wallet!;
    if (wallet.lockedBalance < price || wallet.balance < price) {
      throw new Error(
        `Wallet deduction error for customer ${customer.customerId}`
      );
    }

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
        description: `Wallet payment for subscription ${subscription.subscriptionId}`,
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
    await createSubscriptionDelivery(
      subscription,
      order,
      today,
      customer,
      "WALLET",
      tx
    );
  });
  // Handle next renewal payment cycle
  try {
    await prisma.$transaction(async (tx) => {
      await handleRenewalWalletPayment(
        subscription,
        customer,
        subscriptionPlan.price,
        today,
        tx
      );
    });
  } catch (err) {
    logger.error("Error during subscription renewal via wallet");
  }
};
// Main function to handle COD payment
export const handleCODPayment = async (
  subscription: SubscriptionWithRelations,
  today: Date
): Promise<void> => {
  const { customer, subscriptionPlan, planPrice: price } = subscription;

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
    await createSubscriptionDelivery(
      subscription,
      order,
      today,
      customer,
      "COD",
      tx
    );

    // Update subscription for next delivery
    const frequency = subscription.subscriptionPlan.frequency;
    const nextRenewal = getNextRenewalDate(today, frequency);

    await tx.subscription.update({
      where: { subscriptionId: subscription.subscriptionId },
      data: {
        renewalDate: nextRenewal,
        planPrice: subscriptionPlan.price, // update plan price with latest plan price
        isProcessing: false,
      },
    });

    logger.info(
      `Renewed subscription ${subscription.subscriptionId} with COD.`
    );
  });
};
