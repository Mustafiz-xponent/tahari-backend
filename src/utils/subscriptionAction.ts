import { Subscription } from "@/generated/prisma/client";
import prisma from "@/prisma-client/prismaClient";
import { differenceInCalendarDays } from "date-fns";

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
  return { canProceed: daysLeft <= bufferDays, nextDelivery };
};
export async function pauseOrCancelSubscription(
  subscription: any,
  action: "PAUSED" | "CANCELLED",
  bufferDays: number = 2
): Promise<Subscription> {
  return await prisma.$transaction(async (tx) => {
    const canPauseOrCancel = await canPauseOrCancelSubscription(
      subscription.subscriptionId,
      bufferDays
    );

    if (canPauseOrCancel.canProceed) {
      throw new Error(
        `Can't ${action} subscription within ${bufferDays} days of next delivery`
      );
    }
    // Update subscription
    const updatedSubscription = await tx.subscription.update({
      where: { subscriptionId: subscription.subscriptionId },
      data: { status: action },
    });
    // Cancel delivery
    await tx.subscriptionDelivery.update({
      where: { deliveryId: canPauseOrCancel.nextDelivery?.deliveryId },
      data: { status: "CANCELLED" },
    });
    // Cancel order
    const order = await tx.order.update({
      where: { orderId: canPauseOrCancel.nextDelivery?.orderId },
      data: { status: "CANCELLED" },
    });
    // Create cancelled order tracking
    await tx.orderTracking.create({
      data: {
        orderId: Number(canPauseOrCancel.nextDelivery?.orderId),
        status: "CANCELLED",
        description: `Cancelled due to subscription ${action.toLowerCase()}`,
      },
    });
    // update payment record
    const paymentStatus =
      subscription.paymentMethod === "WALLET" ? "REFUNDED" : "FAILED";
    await tx.payment.update({
      where: { orderId: Number(canPauseOrCancel.nextDelivery?.orderId) },
      data: { paymentStatus },
    });
    if (subscription.paymentMethod === "WALLET") {
      const walletId = subscription.customer.wallet.walletId;
      if (subscription.customer.wallet.lockedBalance < order.totalAmount) {
        throw new Error("Insufficient locked balance");
      }
      // Refund wallet balance
      await tx.wallet.update({
        where: { walletId },
        data: { lockedBalance: { decrement: order.totalAmount } },
      });
      // Update wallet transaction record
      await tx.walletTransaction.update({
        where: { orderId: canPauseOrCancel.nextDelivery?.orderId },
        data: {
          transactionType: "REFUND",
          transactionStatus: "REFUNDED",
          description: `Refund for Order #${canPauseOrCancel.nextDelivery?.orderId}`,
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
          description: `Stock increased for Order #${canPauseOrCancel.nextDelivery?.orderId} ${action}`,
        },
      });
    }
    return updatedSubscription;
  });
}
