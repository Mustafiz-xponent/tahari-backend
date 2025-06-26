/**
 * Service layer for Order entity operations.
 * Contains business logic and database interactions for orders.
 */

import prisma from "../../prisma-client/prismaClient";
import { Order, OrderStatus } from "../../../generated/prisma/client";
import { CreateOrderDto, UpdateOrderDto } from "./orders.dto";
import { getErrorMessage } from "../../utils/errorHandler";

interface CustomerOrdersResult {
  orders: Order[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

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
    const orders = await prisma.order.findMany({
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
      orderBy: { createdAt: "desc" },
    });
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
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
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

/**
 * Get all orders for a specific customer
 * @param customerID - The ID of the customer
 * @returns An array of orders for the customer
 * @throws Error if the order is not found or deletion fails
 */
export async function getOrdersByCustomerId({
  customerId,
  page,
  limit,
  sort,
  status,
  skip,
}: {
  customerId: BigInt;
  page: number;
  limit: number;
  sort: string;
  status: string | undefined;
  skip: number;
}): Promise<CustomerOrdersResult> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { customerId: Number(customerId) },
      select: { customerId: true },
    });
    if (!customer) {
      throw new Error("Customer not found");
    }
    const orders = await prisma.order.findMany({
      where: {
        customerId: Number(customerId),
        ...(status ? { status: status as OrderStatus } : {}),
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
      take: limit,
      skip: skip,
      orderBy: {
        createdAt: sort === "asc" ? "asc" : "desc",
      },
    });
    if (!orders) {
      throw new Error("Orders not found");
    }
    const totalOrders = await prisma.order.count({
      where: {
        customerId: Number(customerId),
        ...(status ? { status: status as OrderStatus } : {}),
      },
    });

    return {
      orders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      totalCount: totalOrders,
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch customer orders: ${getErrorMessage(error)}`
    );
  }
}
