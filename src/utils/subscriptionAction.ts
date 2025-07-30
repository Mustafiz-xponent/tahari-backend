import { Subscription } from "@/generated/prisma/client";
import prisma from "@/prisma-client/prismaClient";
import { differenceInCalendarDays } from "date-fns";
import {
  canLockNextPayment,
  createOrderWithItems,
  createSubscriptionDelivery,
  getNextDeliveryDate,
  getNextRenewalDate,
  hasInsufficientStock,
  updateProductStock,
} from "@/utils/processSubscription";
import { createNotification } from "@/utils/processPayment";

export const canPauseOrCancelSubscription = async (
  subscriptionId: bigint,
  bufferDays: number = 2
) => {
  const today = new Date();
  const nextDelivery = await prisma.subscriptionDelivery.findFirst({
    where: { subscriptionId, deliveryDate: { gte: today } },
    orderBy: { deliveryDate: "asc" },
  }); 
  if (!nextDelivery) return { canProceed: true, nextDelivery: null };
  const daysLeft = differenceInCalendarDays(nextDelivery.deliveryDate, today);
  return { canProceed: daysLeft > bufferDays, nextDelivery };
};
export async function pauseOrCancelSubscription(
  subscription: any,
  action: "PAUSED" | "CANCELLED",
  bufferDays: number = 2,
  userId: bigint
): Promise<Subscription> {
  return await prisma.$transaction(async (tx) => {
    const { canProceed, nextDelivery } = await canPauseOrCancelSubscription(
      subscription.subscriptionId,
      bufferDays
    );

    if (!canProceed) {
      throw new Error(
        `Can't ${action} subscription within ${bufferDays} days of next delivery`
      );
    }
    // Update subscription
    const updatedSubscription = await tx.subscription.update({
      where: { subscriptionId: subscription.subscriptionId },
      data: { status: action, nextDeliveryDate: null },
    });
    if (nextDelivery) {
      // Cancel delivery
      await tx.subscriptionDelivery.update({
        where: { deliveryId: nextDelivery?.deliveryId },
        data: { status: "CANCELLED" },
      });
      // Cancel order
      const order = await tx.order.update({
        where: { orderId: nextDelivery?.orderId },
        data: { status: "CANCELLED", paymentStatus: "REFUNDED" },
      });
      // Create cancelled order tracking
      await tx.orderTracking.create({
        data: {
          orderId: Number(nextDelivery?.orderId),
          status: "CANCELLED",
          description: `Cancelled due to subscription ${action.toLowerCase()}`,
        },
      });
      // update payment record
      const paymentStatus =
        subscription.paymentMethod === "WALLET" ? "REFUNDED" : "FAILED";
      await tx.payment.update({
        where: { orderId: Number(nextDelivery?.orderId) },
        data: { paymentStatus },
      });
      if (subscription.paymentMethod === "WALLET") {
        const walletId = subscription.customer.wallet.walletId;
        if (
          Number(subscription.customer.wallet.lockedBalance) <
          Number(order.totalAmount)
        ) {
          throw new Error("Insufficient locked balance");
        }
        // Refund wallet balance
        await tx.wallet.update({
          where: { walletId },
          data: { lockedBalance: { decrement: order.totalAmount } },
        });
        // Update wallet transaction record
        await tx.walletTransaction.update({
          where: { orderId: nextDelivery?.orderId },
          data: {
            transactionType: "REFUND",
            transactionStatus: "REFUNDED",
            description: `Refund for Order #${nextDelivery?.orderId}`,
          },
        });
        // get product details
        const product = await tx.product.findUnique({
          where: { productId: subscription.subscriptionPlan.productId },
          select: { stockQuantity: true, packageSize: true },
        });
        // update product stock
        await tx.product.update({
          where: { productId: subscription.subscriptionPlan.productId },
          data: { stockQuantity: { increment: product?.packageSize } },
        });
        // update stock transaction
        await tx.stockTransaction.create({
          data: {
            quantity: Number(product?.packageSize),
            transactionType: "IN",
            productId: subscription.subscriptionPlan.productId,
            orderId: order.orderId,
            description: `Stock increased for Order #${nextDelivery?.orderId} ${action}`,
          },
        });
      }
    }
    let message: string = "";
    if (action === "PAUSED") {
      message = `আপনার সাবস্ক্রিপশনটি সাময়িকভাবে স্থগিত করা হয়েছে।`;
    }
    if (action === "CANCELLED") {
      message = `আপনার সাবস্ক্রিপশনটি বাতিল করা হয়েছে।`;
    }
    await createNotification(message, "SUBSCRIPTION", userId, tx);
    return updatedSubscription;
  });
}

export async function processResumeSubscription(
  subscription: any,
  userId: bigint
): Promise<Subscription> {
  return await prisma.$transaction(async (tx) => {
    const plan = subscription.subscriptionPlan;
    const customer = subscription.customer;
    const wallet = customer.wallet;
    const product = plan.product;
    const paymentMethod = subscription.paymentMethod;
    const now = new Date();
    const frequency = plan.frequency;
    const renewalDate = getNextRenewalDate(now, frequency);
    const nextDeliveryDate = getNextDeliveryDate(now, frequency);
    // Check product stock
    if (hasInsufficientStock(product, 1)) {
      throw new Error(`Insufficient product stock`);
    }
    // Update subscription
    const updatedSubscription = await tx.subscription.update({
      where: { subscriptionId: subscription.subscriptionId },
      data: {
        renewalDate: renewalDate,
        status: "ACTIVE",
        planPrice: plan.price,
        nextDeliveryDate,
      },
    });
    // Create order with items
    const order = await createOrderWithItems(
      subscription,
      customer,
      product,
      plan.price,
      paymentMethod,
      tx
    );
    // Create subscription delivery
    await createSubscriptionDelivery(
      subscription,
      order,
      now,
      customer,
      paymentMethod,
      tx
    );
    //
    if (paymentMethod === "WALLET") {
      if (!canLockNextPayment(wallet, plan.price)) {
        throw new Error("Insufficient wallet balance to lock funds.");
      }
      // Lock funds
      await tx.wallet.update({
        where: { walletId: wallet.walletId },
        data: {
          lockedBalance: { increment: plan.price },
        },
      });
      // Record wallet transaction for lock
      const walletTransaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.walletId,
          amount: plan.price,
          transactionType: "PURCHASE",
          transactionStatus: "LOCKED",
          orderId: order.orderId,
          description: `LOCK_FUNDS_FOR_SUBSCRIPTION:#${subscription.subscriptionId}_PLAN:#${subscription.subscriptionPlan.planId}_ORDER:#${order.orderId}`, // Required description for further processing!!!
        },
      });
      // Create payment record
      await tx.payment.create({
        data: {
          amount: order.totalAmount,
          paymentMethod: "WALLET",
          paymentStatus: "LOCKED",
          orderId: order.orderId,
          transactionId: `ORDER_${order.orderId}_${Date.now()}`,
          walletTransactionId: walletTransaction.transactionId,
        },
      });
      // Update product stock
      await updateProductStock(product, tx, order.orderId);
    } else if (paymentMethod === "COD") {
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
    } else {
      throw new Error("Invalid payment method");
    }
    const message = `আপনার সাবস্ক্রিপশনটি পুনরায় চালু করা হয়েছে।`;
    await createNotification(message, "SUBSCRIPTION", userId, tx);
    return updatedSubscription;
  });
}
