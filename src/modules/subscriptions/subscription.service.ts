/**
 * Service layer for Subscription entity operations.
 * Contains business logic and database interactions for subscriptions.
 */

import prisma from "@/prisma-client/prismaClient";
import { Subscription } from "@/generated/prisma/client";
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from "@/modules/subscriptions/subscription.dto";
import { getErrorMessage } from "@/utils/errorHandler";
import { addWeeks, addMonths } from "date-fns";

/**
 * Create a new subscription
 */
export async function createSubscription(
  data: CreateSubscriptionDto
): Promise<Subscription> {
  try {
    return await prisma.$transaction(async (tx) => {
      // Find plan & validate
      const plan = await tx.subscriptionPlan.findUnique({
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
      const requiredStock = plan.product.packageSize * 1;
      if (requiredStock > plan.product.stockQuantity) {
        throw new Error(
          `Insufficient stock for product ${plan.product.name}. Available: ${plan.product.stockQuantity}, Required: ${requiredStock}`
        );
      }
      // Find customer & validate
      const customer = await tx.customer.findUnique({
        where: { customerId: data.customerId },
        include: { wallet: true },
      });
      if (!customer) throw new Error("Customer not found");

      //  Handle payment method
      if (data.paymentMethod === "WALLET") {
        if (!customer.wallet) {
          throw new Error(
            "Customer wallet not found.Please create wallet first"
          );
        }
        const availableBalance =
          customer.wallet.balance.toNumber() -
          customer.wallet.lockedBalance.toNumber();

        if (availableBalance < plan.price.toNumber()) {
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

        // Record wallet transaction for lock
        await tx.walletTransaction.create({
          data: {
            walletId: customer.wallet.walletId,
            amount: plan.price,
            transactionType: "PURCHASE",
            transactionStatus: "PENDING",
            description: `Initial lock for subscription plan ${data.planId}`,
          },
        });
      } else if (data.paymentMethod !== "COD") {
        throw new Error("Invalid payment method. Must be WALLET or COD.");
      }

      //  Create subscription
      const now = new Date();
      const frequency = plan.frequency.trim().toUpperCase();

      if (!["WEEKLY", "MONTHLY"].includes(frequency)) {
        throw new Error(
          `Invalid frequency '${frequency}'. Must be WEEKLY or MONTHLY.`
        );
      }
      const renewalDate =
        frequency === "WEEKLY" ? addWeeks(now, 1) : addMonths(now, 1);

      const subscription = await tx.subscription.create({
        data: {
          startDate: now,
          renewalDate: renewalDate,
          status: "ACTIVE",
          paymentMethod: data.paymentMethod,
          customerId: data.customerId,
          planId: data.planId,
          shippingAddress: data.shippingAddress,
        },
      });

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
