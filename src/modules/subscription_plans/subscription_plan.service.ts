/**
 * Service layer for SubscriptionPlan entity operations.
 * Contains business logic and database interactions for subscription plans.
 */

import prisma from "@/prisma-client/prismaClient";
import {
  SubscriptionPlan,
  SubscriptionPlanType,
} from "@/generated/prisma/client";
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from "@/modules/subscription_plans/subscription_plan.dto";
import { getErrorMessage } from "@/utils/errorHandler";

/**
 * Create a new subscription plan
 * @param data - Data required to create a subscription plan
 * @returns The created subscription plan
 * @throws Error if the subscription plan cannot be created (e.g., invalid foreign keys)
 */
export async function createSubscriptionPlan(
  data: CreateSubscriptionPlanDto
): Promise<SubscriptionPlan> {
  try {
    const product = await prisma.product.findUnique({
      where: { productId: data.productId },
    });
    if (!product) {
      throw new Error("Product not found");
    }
    if (!product.isSubscription) {
      throw new Error("Product is not under subscription");
    }
    const subscriptionPlan = await prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        frequency: data.frequency,
        price: data.price,
        description: data.description,
        productId: data.productId,
      },
    });
    return subscriptionPlan;
  } catch (error) {
    throw new Error(
      `Failed to create subscription plan: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Retrieve all subscription plans
 * @returns An array of all subscription plans
 * @throws Error if the query fails
 */
export async function getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const subscriptionPlans = await prisma.subscriptionPlan.findMany();
    return subscriptionPlans;
  } catch (error) {
    throw new Error(
      `Failed to fetch subscription plans: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Retrieve a subscription plan by its ID
 * @param planId - The ID of the subscription plan
 * @returns The subscription plan if found, or null if not found
 * @throws Error if the query fails
 */
export async function getSubscriptionPlanById(
  planId: BigInt
): Promise<SubscriptionPlan | null> {
  try {
    const subscriptionPlan = await prisma.subscriptionPlan.findUnique({
      where: { planId: Number(planId) },
    });
    if (!subscriptionPlan) throw new Error("Subscription plan not found");
    return subscriptionPlan;
  } catch (error) {
    throw new Error(
      `Failed to fetch subscription plan: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Update a subscription plan by its ID
 * @param planId - The ID of the subscription plan to update
 * @param data - Data to update the subscription plan
 * @returns The updated subscription plan
 * @throws Error if the subscription plan is not found or update fails
 */
export async function updateSubscriptionPlan(
  planId: BigInt,
  data: UpdateSubscriptionPlanDto
): Promise<SubscriptionPlan> {
  try {
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { planId: Number(planId) },
    });
    if (!existingPlan) {
      throw new Error("Subscription plan not found");
    }
    const subscriptionPlan = await prisma.subscriptionPlan.update({
      where: { planId: Number(planId) },
      data: {
        name: data.name,
        frequency: data.frequency,
        price: data.price,
        description: data.description,
        productId: data.productId,
      },
    });
    return subscriptionPlan;
  } catch (error) {
    throw new Error(
      `Failed to update subscription plan: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Delete a subscription plan by its ID
 * @param planId - The ID of the subscription plan to delete
 * @throws Error if the subscription plan is not found or deletion fails
 */
export async function deleteSubscriptionPlan(planId: BigInt): Promise<void> {
  try {
    const subscriptionPlan = await prisma.subscriptionPlan.delete({
      where: { planId: Number(planId) },
    });
    if (!subscriptionPlan) {
      throw new Error("Subscription plan not found");
    }
  } catch (error) {
    throw new Error(
      `Failed to delete subscription plan: ${getErrorMessage(error)}`
    );
  }
}
