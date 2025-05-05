/**
 * Service layer for SubscriptionDelivery entity operations.
 * Contains business logic and database interactions for subscription deliveries.
 */

import prisma from "../../prisma-client/prismaClient";
import { SubscriptionDelivery } from "../../../generated/prisma/client";
import {
  CreateSubscriptionDeliveryDto,
  UpdateSubscriptionDeliveryDto,
} from "./subscription-delivery.dto";
import { getErrorMessage } from "@/utils/errorHandler";

/**
 * Create a new subscription delivery
 */
export async function createSubscriptionDelivery(
  data: CreateSubscriptionDeliveryDto
): Promise<SubscriptionDelivery> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { subscriptionId: Number(data.subscriptionId) },
    });
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const order = await prisma.order.findUnique({
      where: { orderId: Number(data.orderId) },
    });
    if (!order) {
      throw new Error("Order not found");
    }

    const subscriptionDelivery = await prisma.subscriptionDelivery.create({
      data: {
        deliveryDate: new Date(data.deliveryDate),
        status: data.status,
        subscriptionId: data.subscriptionId,
        orderId: data.orderId,
      },
    });
    return subscriptionDelivery;
  } catch (error) {
    throw new Error(
      `Failed to create subscription delivery: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Retrieve all subscription deliveries
 */
export async function getAllSubscriptionDeliveries(): Promise<
  SubscriptionDelivery[]
> {
  try {
    const subscriptionDeliveries = await prisma.subscriptionDelivery.findMany();
    return subscriptionDeliveries;
  } catch (error) {
    throw new Error(
      `Failed to fetch subscription deliveries: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Retrieve a subscription delivery by its ID
 */
export async function getSubscriptionDeliveryById(
  deliveryId: BigInt
): Promise<SubscriptionDelivery | null> {
  try {
    const subscriptionDelivery = await prisma.subscriptionDelivery.findUnique({
      where: { deliveryId: Number(deliveryId) },
    });
    return subscriptionDelivery;
  } catch (error) {
    throw new Error(
      `Failed to fetch subscription delivery: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Update a subscription delivery by its ID
 */
export async function updateSubscriptionDelivery(
  deliveryId: BigInt,
  data: UpdateSubscriptionDeliveryDto
): Promise<SubscriptionDelivery> {
  try {
    if (data.subscriptionId) {
      const subscription = await prisma.subscription.findUnique({
        where: { subscriptionId: Number(data.subscriptionId) },
      });
      if (!subscription) {
        throw new Error("Subscription not found");
      }
    }

    if (data.orderId) {
      const order = await prisma.order.findUnique({
        where: { orderId: Number(data.orderId) },
      });
      if (!order) {
        throw new Error("Order not found");
      }
    }

    const subscriptionDelivery = await prisma.subscriptionDelivery.update({
      where: { deliveryId: Number(deliveryId) },
      data: {
        deliveryDate: data.deliveryDate
          ? new Date(data.deliveryDate)
          : undefined,
        status: data.status,
        subscriptionId: data.subscriptionId,
        orderId: data.orderId,
      },
    });
    return subscriptionDelivery;
  } catch (error) {
    throw new Error(
      `Failed to update subscription delivery: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Delete a subscription delivery by its ID
 */
export async function deleteSubscriptionDelivery(
  deliveryId: BigInt
): Promise<void> {
  try {
    await prisma.subscriptionDelivery.delete({
      where: { deliveryId: Number(deliveryId) },
    });
  } catch (error) {
    throw new Error(
      `Failed to delete subscription delivery: ${getErrorMessage(error)}`
    );
  }
}
