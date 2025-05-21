/**
 * Service layer for OrderTracking entity operations.
 * Contains business logic and database interactions for order tracking entries.
 */

import prisma from "../../prisma-client/prismaClient";
import { OrderTracking } from "../../../generated/prisma/client";
import {
  CreateOrderTrackingDto,
  UpdateOrderTrackingDto,
} from "./order-tracking.dto";
import { getErrorMessage } from "../../utils/errorHandler";

/**
 * Create a new order tracking entry
 */
export async function createOrderTracking(
  data: CreateOrderTrackingDto
): Promise<OrderTracking> {
  try {
    const order = await prisma.order.findUnique({
      where: { orderId: Number(data.orderId) },
    });
    if (!order) {
      throw new Error("Order not found");
    }

    const orderTracking = await prisma.orderTracking.create({
      data: {
        status: data.status,
        description: data.description,
        orderId: data.orderId,
      },
    });
    return orderTracking;
  } catch (error) {
    throw new Error(
      `Failed to create order tracking: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Retrieve all order tracking entries
 */
export async function getAllOrderTrackings(): Promise<OrderTracking[]> {
  try {
    const orderTrackings = await prisma.orderTracking.findMany();
    return orderTrackings;
  } catch (error) {
    throw new Error(
      `Failed to fetch order trackings: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Retrieve an order tracking entry by its ID
 */
export async function getOrderTrackingById(
  trackingId: BigInt
): Promise<OrderTracking | null> {
  try {
    const orderTracking = await prisma.orderTracking.findUnique({
      where: { trackingId: Number(trackingId) },
    });
    return orderTracking;
  } catch (error) {
    throw new Error(
      `Failed to fetch order tracking: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Update an order tracking entry by its ID
 */
export async function updateOrderTracking(
  trackingId: BigInt,
  data: UpdateOrderTrackingDto
): Promise<OrderTracking> {
  try {
    if (data.orderId) {
      const order = await prisma.order.findUnique({
        where: { orderId: Number(data.orderId) },
      });
      if (!order) {
        throw new Error("Order not found");
      }
    }

    const orderTracking = await prisma.orderTracking.update({
      where: { trackingId: Number(trackingId) },
      data: {
        status: data.status,
        description: data.description,
        orderId: data.orderId,
      },
    });
    return orderTracking;
  } catch (error) {
    throw new Error(
      `Failed to update order tracking: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Delete an order tracking entry by its ID
 */
export async function deleteOrderTracking(trackingId: BigInt): Promise<void> {
  try {
    await prisma.orderTracking.delete({
      where: { trackingId: Number(trackingId) },
    });
  } catch (error) {
    throw new Error(
      `Failed to delete order tracking: ${getErrorMessage(error)}`
    );
  }
}
