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

/**
 * Create a new subscription
 */
export async function createSubscription(
  data: CreateSubscriptionDto
): Promise<Subscription> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { customerId: data.customerId },
    });
    if (!customer) {
      throw new Error("Customer not found");
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { planId: Number(data.planId) },
    });
    if (!plan) {
      throw new Error("Subscription plan not found");
    }

    const subscription = await prisma.subscription.create({
      data: {
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: data.status,
        renewalDate: data.renewalDate ? new Date(data.renewalDate) : undefined,
        customerId: data.customerId,
        planId: data.planId,
      },
    });
    return subscription;
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
