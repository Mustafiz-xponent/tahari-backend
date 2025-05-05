/**
 * Service layer for OrderItem entity operations.
 * Contains business logic and database interactions for order items.
 */

import prisma from "../../prisma-client/prismaClient";
import { OrderItem } from "../../../generated/prisma/client";
import { CreateOrderItemDto, UpdateOrderItemDto } from "./order-item.dto";
import { getErrorMessage } from "@/utils/errorHandler";

/**
 * Create a new order item
 * @param data - Data required to create an order item
 * @returns The created order item
 * @throws Error if the order item cannot be created (e.g., invalid orderId or productId)
 */
export async function createOrderItem(
  data: CreateOrderItemDto
): Promise<OrderItem> {
  try {
    // Validate orderId existence
    const order = await prisma.order.findUnique({
      where: { orderId: Number(data.orderId) },
    });
    if (!order) {
      throw new Error("Order not found");
    }

    // Validate productId existence
    const product = await prisma.product.findUnique({
      where: { productId: data.productId },
    });
    if (!product) {
      throw new Error("Product not found");
    }

    const orderItem = await prisma.orderItem.create({
      data: {
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        subtotal: data.subtotal,
        orderId: data.orderId,
        productId: data.productId,
      },
    });
    return orderItem;
  } catch (error) {
    throw new Error(`Failed to create order item: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieve all order items
 * @returns An array of all order items
 * @throws Error if the query fails
 */
export async function getAllOrderItems(): Promise<OrderItem[]> {
  try {
    const orderItems = await prisma.orderItem.findMany();
    return orderItems;
  } catch (error) {
    throw new Error(`Failed to fetch order items: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieve an order item by its ID
 * @param orderItemId - The ID of the order item
 * @returns The order item if found, or null if not found
 * @throws Error if the query fails
 */
export async function getOrderItemById(
  orderItemId: BigInt
): Promise<OrderItem | null> {
  try {
    const orderItem = await prisma.orderItem.findUnique({
      where: { orderItemId: Number(orderItemId) },
    });
    return orderItem;
  } catch (error) {
    throw new Error(`Failed to fetch order item: ${getErrorMessage(error)}`);
  }
}

/**
 * Update an order item by its ID
 * @param orderItemId - The ID of the order item to update
 * @param data - Data to update the order item
 * @returns The updated order item
 * @throws Error if the order item is not found or update fails
 */
export async function updateOrderItem(
  orderItemId: BigInt,
  data: UpdateOrderItemDto
): Promise<OrderItem> {
  try {
    // Validate orderId existence if provided
    if (data.orderId) {
      const order = await prisma.order.findUnique({
        where: { orderId: Number(data.orderId) },
      });
      if (!order) {
        throw new Error("Order not found");
      }
    }

    // Validate productId existence if provided
    if (data.productId) {
      const product = await prisma.product.findUnique({
        where: { productId: data.productId },
      });
      if (!product) {
        throw new Error("Product not found");
      }
    }

    const orderItem = await prisma.orderItem.update({
      where: { orderItemId: Number(orderItemId) },
      data: {
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        subtotal: data.subtotal,
        orderId: data.orderId,
        productId: data.productId,
      },
    });
    return orderItem;
  } catch (error) {
    throw new Error(`Failed to update order item: ${getErrorMessage(error)}`);
  }
}

/**
 * Delete an order item by its ID
 * @param orderItemId - The ID of the order item to delete
 * @throws Error if the order item is not found or deletion fails
 */
export async function deleteOrderItem(orderItemId: BigInt): Promise<void> {
  try {
    await prisma.orderItem.delete({
      where: { orderItemId: Number(orderItemId) },
    });
  } catch (error) {
    throw new Error(`Failed to delete order item: ${getErrorMessage(error)}`);
  }
}
