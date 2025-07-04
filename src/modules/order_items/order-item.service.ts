/**
 * Service layer for OrderItem entity operations.
 * Contains business logic and database interactions for order items.
 */

import prisma from "../../prisma-client/prismaClient";
import { OrderItem } from "../../../generated/prisma/client";
import {
  CreateOrderItemDto,
  CreateOrderItemsDto,
  UpdateOrderItemDto,
} from "./order-item.dto";
import { getErrorMessage } from "../../utils/errorHandler";

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

    if (product.stockQuantity < data.quantity * data.packageSize) {
      throw new Error("Insufficient stock quantity");
    }

    const orderItem = await prisma.orderItem.create({
      data: {
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        unitType: data.unitType,
        packageSize: data.packageSize,
        subtotal: data.subtotal,
        orderId: Number(data.orderId),
        productId: Number(data.productId),
      },
    });
    return orderItem;
  } catch (error) {
    throw new Error(`Failed to create order item: ${getErrorMessage(error)}`);
  }
}

/**
 * Creates multiple order items with validation.
 * @param {CreateOrderItemsDto} data - Order ID and items to create
 * @returns {Promise<Prisma.OrderItem[]>} Created order items
 * @throws {Error} If order or products don't exist
 */
export async function createOrderItems(data: CreateOrderItemsDto) {
  // Convert all IDs to BigInt for consistent comparison
  const orderId = data.orderId;
  const productIds = data.items.map((item) => item.productId);

  // Validate order exists (convert to number for Prisma query)
  const order = await prisma.order.findUnique({
    where: { orderId: Number(orderId) },
  });
  if (!order) throw new Error(`Order not found: ${orderId.toString()}`);

  // Validate products exist
  const products = await prisma.product.findMany({
    where: {
      productId: {
        in: productIds.map((id) => Number(id)), // Convert to number for query
      },
    },
  });

  // Compare using BigInt for type safety
  const missingProducts = productIds.filter(
    (id) => !products.some((p) => BigInt(p.productId) === id)
  );

  if (missingProducts.length > 0) {
    throw new Error(`Products not found: ${missingProducts.join(", ")}`);
  }

  // Validate stock quantity
  for (const item of data.items) {
    const product = products.find(
      (p) => BigInt(p.productId) === item.productId
    );
    if (!product) {
      throw new Error(`Product not found: ${item.productId.toString()}`);
    }

    if (product.stockQuantity < item.quantity * item.packageSize) {
      throw new Error(
        `Insufficient stock quantity for product ${item.productId.toString()}`
      );
    }
  }
  // Create items in transaction (convert to number for Prisma)
  return prisma.$transaction(
    data.items.map((item) =>
      prisma.orderItem.create({
        data: {
          orderId: Number(orderId),
          productId: Number(item.productId),
          unitType: item.unitType,
          packageSize: item.packageSize,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        },
      })
    )
  );
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
        unitType: data.unitType,
        packageSize: data.packageSize,
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
