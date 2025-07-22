/**
 * Service layer for Subscription entity operations.
 * Contains business logic and database interactions for subscriptions.
 */
import prisma from "@/prisma-client/prismaClient";
import { Subscription, SubscriptionStatus } from "@/generated/prisma/client";
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from "@/modules/subscriptions/subscription.dto";
import { getErrorMessage } from "@/utils/errorHandler";
import {
  canLockNextPayment,
  createOrderWithItems,
  createSubscriptionDelivery,
  getNextRenewalDate,
  hasInsufficientStock,
  updateProductStock,
} from "@/utils/processSubscription";
import { pauseOrCancelSubscription } from "@/utils/subscriptionAction";

/**
 * Create a new subscription
 */
export async function createSubscription(
  userId: bigint,
  data: CreateSubscriptionDto
): Promise<Subscription> {
  try {
    // Find plan & validate
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { planId: data.planId },
      include: { product: true },
    });
    if (!plan) throw new Error("Subscription plan not found");
    if (!plan.product?.isSubscription) {
      throw new Error(
        `Product ${
          plan.product?.name || "N/A"
        } is not available for subscription`
      );
    }
    // check stock availability
    if (hasInsufficientStock(plan.product, 1)) {
      throw new Error(`Insufficient stock`);
    }
    // Find customer & validate
    const customer = await prisma.customer.findUnique({
      where: { userId },
      include: { wallet: true },
    });
    if (!customer) throw new Error("Customer not found");
    const isPlanPurchased = await prisma.subscription.findFirst({
      where: { planId: data.planId, customerId: customer.customerId },
    });
    if (isPlanPurchased) throw new Error("Plan already purchased");
    //  Create subscription
    const now = new Date();
    const frequency = plan.frequency;
    const renewalDate = getNextRenewalDate(now, frequency);

    return await prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          startDate: now,
          renewalDate: renewalDate,
          status: "ACTIVE",
          paymentMethod: data.paymentMethod,
          planPrice: plan.price,
          customerId: customer.customerId,
          planId: data.planId,
          shippingAddress: data.shippingAddress,
        },
        include: {
          customer: { include: { wallet: true } },
          subscriptionPlan: { include: { product: true } },
        },
      });
      //  Handle payment method
      if (data.paymentMethod === "WALLET") {
        if (!customer.wallet) {
          throw new Error("Wallet not found. Please create wallet first");
        }

        if (!canLockNextPayment(customer.wallet, plan.price)) {
          throw new Error("Insufficient wallet balance to lock funds.");
        }

        // Lock funds
        await tx.wallet.update({
          where: { walletId: customer.wallet.walletId },
          data: {
            lockedBalance: {
              increment: plan.price,
            },
          },
        });

        const order = await createOrderWithItems(
          subscription,
          customer,
          plan.product,
          plan.price,
          "WALLET",
          tx
        );
        // Record wallet transaction for lock
        const walletTransaction = await tx.walletTransaction.create({
          data: {
            walletId: customer.wallet.walletId,
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
        await updateProductStock(plan.product, tx, order.orderId);
        // Create subscription delivery
        await createSubscriptionDelivery(
          subscription,
          order,
          now,
          customer,
          "WALLET",
          tx
        );
      } else if (data.paymentMethod === "COD") {
        const order = await createOrderWithItems(
          subscription,
          customer,
          plan.product,
          plan.price,
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
          now,
          customer,
          "COD",
          tx
        );
      } else {
        throw new Error("Invalid payment method. Must be WALLET or COD.");
      }

      return subscription;
    });
  } catch (error) {
    throw new Error(`Failed to create subscription: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieve all subscriptions
 */
export async function getAllSubscriptions(): Promise<Subscription[]> {
  try {
    const subscriptions = await prisma.subscription.findMany();
    return subscriptions;
  } catch (error) {
    throw new Error(`Failed to fetch subscriptions: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieve a subscription by its ID
 */
export async function getSubscriptionById(
  subscriptionId: BigInt
): Promise<Subscription | null> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { subscriptionId: Number(subscriptionId) },
    });

    return subscription;
  } catch (error) {
    throw new Error(`Failed to fetch subscription: ${getErrorMessage(error)}`);
  }
}
/**
 * Retrieve customer subscriptions
 */
export async function getUserSubscriptions(
  userId: BigInt,
  paginationParams: { page: number; limit: number; skip: number; sort: string },
  status: SubscriptionStatus
): Promise<any> {
  try {
    const { page, limit, skip, sort } = paginationParams;
    const customer = await prisma.customer.findUnique({
      where: { userId: Number(userId) },
    });
    if (!customer) throw new Error("Customer not found");

    const subscriptions = await prisma.subscription.findMany({
      where: { customerId: customer.customerId, ...(status && { status }) },
      take: limit,
      skip: skip,
      orderBy: {
        createdAt: sort === "asc" ? "asc" : "desc",
      },
    });

    return {
      subscriptions,
      currentPage: page,
      totalPages: Math.ceil(subscriptions.length / limit),
      totalCount: subscriptions.length,
    };
  } catch (error) {
    throw new Error(`Failed to fetch subscription: ${getErrorMessage(error)}`);
  }
}
/**
 * Update a subscription by its ID
 */
export async function updateSubscription(
  subscriptionId: BigInt,
  data: UpdateSubscriptionDto
): Promise<Subscription> {
  try {
    if (data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { customerId: data.customerId },
      });
      if (!customer) {
        throw new Error("Customer not found");
      }
    }

    if (data.planId) {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { planId: Number(data.planId) },
      });
      if (!plan) {
        throw new Error("Subscription plan not found");
      }
    }

    const subscription = await prisma.subscription.update({
      where: { subscriptionId: Number(subscriptionId) },
      data: {
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: data.status,
        renewalDate: data.renewalDate ? new Date(data.renewalDate) : undefined,
        customerId: data.customerId,
        planId: data.planId,
      },
    });
    return subscription;
  } catch (error) {
    throw new Error(`Failed to update subscription: ${getErrorMessage(error)}`);
  }
}
/**
 * Pause a subscription by its ID
 */
export async function pauseSubscription(
  subscriptionId: BigInt
): Promise<Subscription> {
  try {
    const bufferDays = 2;
    const subscription = await prisma.subscription.findUnique({
      where: { subscriptionId: Number(subscriptionId) },
      include: {
        subscriptionDeliveries: true,
        subscriptionPlan: true,
        customer: { include: { wallet: true } },
      },
    });
    if (!subscription) throw new Error("Subscription not found");
    if (
      subscription.status === "PAUSED" ||
      subscription.status === "CANCELLED"
    ) {
      throw new Error(`Subscription already ${subscription.status}`);
    }
    const result = await pauseOrCancelSubscription(
      subscription,
      "PAUSED",
      bufferDays
    );
    return result;
  } catch (error) {
    throw new Error(`Failed to pause subscription: ${getErrorMessage(error)}`);
  }
}
/**
 * Cancel a subscription by its ID
 */
export async function cancelSubscription(
  subscriptionId: BigInt
): Promise<Subscription> {
  try {
    const bufferDays = 2;
    const subscription = await prisma.subscription.findUnique({
      where: { subscriptionId: Number(subscriptionId) },
      include: {
        subscriptionDeliveries: true,
        subscriptionPlan: true,
        customer: { include: { wallet: true } },
      },
    });
    if (!subscription) throw new Error("Subscription not found");
    if (subscription.status === "CANCELLED") {
      throw new Error("Subscription already cancelled");
    }
    let result;
    if (subscription.status === "PAUSED") {
      result = await prisma.subscription.update({
        where: { subscriptionId: subscription.subscriptionId },
        data: { status: "CANCELLED" },
      });
    } else {
      result = await pauseOrCancelSubscription(
        subscription,
        "CANCELLED",
        bufferDays
      );
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to cancel subscription: ${getErrorMessage(error)}`);
  }
}
/**
 * Delete a subscription by its ID
 */
export async function deleteSubscription(
  subscriptionId: BigInt
): Promise<void> {
  try {
    await prisma.subscription.delete({
      where: { subscriptionId: Number(subscriptionId) },
    });
  } catch (error) {
    throw new Error(`Failed to delete subscription: ${getErrorMessage(error)}`);
  }
}
