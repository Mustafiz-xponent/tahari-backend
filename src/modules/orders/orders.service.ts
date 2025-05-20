/**
 * Service layer for Order entity operations.
 * Contains business logic and database interactions for orders.
 */

import prisma from "../../prisma-client/prismaClient";
import { Order } from "../../../generated/prisma/client";
import { CreateOrderDto, UpdateOrderDto } from "./orders.dto";
import { getErrorMessage } from "../../utils/errorHandler";

/**
 * Create a new order
 * @param data - Data required to create an order
 * @returns The created order
 * @throws Error if the order cannot be created (e.g., invalid customerId)
 */
export async function createOrder(data: CreateOrderDto): Promise<Order> {
  try {
    // Validate customerId existence
    const customer = await prisma.customer.findUnique({
      where: { customerId: data.customerId },
    });
    if (!customer) {
      throw new Error("Customer not found");
    }

    const order = await prisma.order.create({
      data: {
        status: data.status,
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        shippingAddress: data.shippingAddress,
        customerId: data.customerId,
        isSubscription: data.isSubscription ?? false,
        isPreorder: data.isPreorder ?? false,
        preorderDeliveryDate: data.preorderDeliveryDate
          ? new Date(data.preorderDeliveryDate)
          : undefined,
      },
    });
    return order;
  } catch (error) {
    throw new Error(`Failed to create order: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieve all orders
 * @returns An array of all orders
 * @throws Error if the query fails
 */
export async function getAllOrders(): Promise<Order[]> {
  try {
    const orders = await prisma.order.findMany();
    return orders;
  } catch (error) {
    throw new Error(`Failed to fetch orders: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieve an order by its ID
 * @param orderId - The ID of the order
 * @returns The order if found, or null if not found
 * @throws Error if the query fails
 */
export async function getOrderById(orderId: BigInt): Promise<Order | null> {
  try {
    const order = await prisma.order.findUnique({
      where: { orderId: Number(orderId) },
    });
    return order;
  } catch (error) {
    throw new Error(`Failed to fetch order: ${getErrorMessage(error)}`);
  }
}

/**
 * Update an order by its ID
 * @param orderId - The ID of the order to update
 * @param data - Data to update the order
 * @returns The updated order
 * @throws Error if the order is not found or update fails
 */
export async function updateOrder(
  orderId: BigInt,
  data: UpdateOrderDto
): Promise<Order> {
  try {
    // Validate customerId existence if provided
    if (data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { customerId: data.customerId },
      });
      if (!customer) {
        throw new Error("Customer not found");
      }
    }

    const order = await prisma.order.update({
      where: { orderId: Number(orderId) },
      data: {
        status: data.status,
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        shippingAddress: data.shippingAddress,
        customerId: data.customerId,
        isSubscription: data.isSubscription,
        isPreorder: data.isPreorder,
        preorderDeliveryDate: data.preorderDeliveryDate
          ? new Date(data.preorderDeliveryDate)
          : undefined,
      },
    });
    return order;
  } catch (error) {
    throw new Error(`Failed to update order: ${getErrorMessage(error)}`);
  }
}

/**
 * Delete an order by its ID
 * @param orderId - The ID of the order to delete
 * @throws Error if the order is not found or deletion fails
 */
export async function deleteOrder(orderId: BigInt): Promise<void> {
  try {
    await prisma.order.delete({
      where: { orderId: Number(orderId) },
    });
  } catch (error) {
    throw new Error(`Failed to delete order: ${getErrorMessage(error)}`);
  }
}
