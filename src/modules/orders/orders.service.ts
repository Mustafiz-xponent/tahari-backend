/**
 * Service layer for Order entity operations.
 * Contains business logic and database interactions for orders.
 */

import prisma from "../../prisma-client/prismaClient";
import { Order, OrderStatus } from "../../../generated/prisma/client";
import { CreateOrderDto, UpdateOrderDto } from "./orders.dto";
import { getErrorMessage } from "../../utils/errorHandler";
import { getBatchAccessibleImageUrls } from "../../utils/fileUpload/s3Aws";

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
    return await prisma.$transaction(async (tx) => {
      //  Validate customer
      const customer = await tx.customer.findUnique({
        where: { customerId: data.customerId },
      });
      if (!customer) {
        throw new Error("Customer not found");
      }

      //  Create order
      const order = await tx.order.create({
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

      // Create initial tracking entry
      await tx.orderTracking.create({
        data: {
          orderId: Number(order.orderId),
          status: "PENDING",
          description: "Order created and payment pending for Cash on Delivery",
        },
      });

      return order;
    });
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
export async function getOrderById(orderId: BigInt) {
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
    if (!order) {
      throw new Error("Order not found");
    }
    const updatedOrderItems = await Promise.all(
      order.orderItems.map(async (item) => {
        const accessibleUrls =
          item.product.imageUrls.length > 0
            ? await getBatchAccessibleImageUrls(
                item.product.imageUrls,
                item.product.isPrivateImages,
                300
              )
            : [];

        return {
          ...item.product,
          quantity: item.quantity,
          accessibleImageUrls: accessibleUrls,
        };
      })
    );
    return { ...order, orderItems: updatedOrderItems };
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
    return await prisma.$transaction(async (tx) => {
      if (data.customerId) {
        const customer = await tx.customer.findUnique({
          where: { customerId: data.customerId },
        });
        if (!customer) {
          throw new Error("Customer not found");
        }
      }

      // Get current order status
      const currentOrder = await tx.order.findUnique({
        where: { orderId: Number(orderId) },
        select: {
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          orderItems: true,
        },
      });

      if (!currentOrder) {
        throw new Error("Order not found");
      }

      // Update order
      const updatedOrder = await tx.order.update({
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
      if (data.status) {
        const orderStatusFlow: OrderStatus[] = [
          "PENDING",
          "CONFIRMED",
          "PROCESSING",
          "SHIPPED",
          "DELIVERED",
        ];
        const currentStatusIndex = orderStatusFlow.indexOf(currentOrder.status);
        const newStatusIndex = orderStatusFlow.indexOf(data.status);

        if (data.status === currentOrder.status) {
          throw new Error(`Order is already ${currentOrder.status}`);
        }
        if (newStatusIndex > currentStatusIndex + 1) {
          throw new Error(
            `Invalid status transition: Cannot skip status levels from ${currentOrder.status} to ${data.status}`
          );
        }
        // if Backward status move detected--
        if (newStatusIndex < currentStatusIndex) {
          // Delete any forward tracking records
          await tx.orderTracking.deleteMany({
            where: {
              orderId: Number(orderId),
              status: {
                in: orderStatusFlow.filter(
                  (status) => orderStatusFlow.indexOf(status) > newStatusIndex
                ),
              },
            },
          });
        }
      }
      // Log only if status actually changed & not already tracked
      if (data.status && data.status !== currentOrder.status) {
        const alreadyTracked = await tx.orderTracking.findFirst({
          where: {
            orderId: Number(orderId),
            status: data.status,
          },
        });

        if (!alreadyTracked) {
          await tx.orderTracking.create({
            data: {
              orderId: Number(orderId),
              status: data.status,
              description: `Status updated to ${data.status}`,
            },
          });
        }
      }
      //  If payment status changed to COMPLETED AND payment method is COD → do stock ops
      if (
        data.paymentStatus === "COMPLETED" &&
        currentOrder.paymentMethod === "COD"
      ) {
        for (const item of currentOrder.orderItems) {
          // Decrement stock
          await tx.product.update({
            where: { productId: item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });

          // Create stock transaction
          await tx.stockTransaction.create({
            data: {
              quantity: item.quantity,
              transactionType: "OUT",
              productId: item.productId,
              orderId: Number(orderId),
              description: `Stock reduced for Order #${orderId}`,
            },
          });
        }
        // update payment record
        await tx.payment.updateMany({
          where: { orderId: Number(orderId), paymentMethod: "COD" },
          data: {
            paymentStatus: "PENDING",
          },
        });
        // Also track the order update
        await tx.orderTracking.create({
          data: {
            orderId: Number(orderId),
            status: "CONFIRMED",
            description: "Order confirmed and payment completed via COD",
          },
        });
      }

      return updatedOrder;
    });
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
export async function getCustomerOrders({
  userId,
  page,
  limit,
  sort,
  status,
  skip,
}: {
  userId: BigInt;
  page: number;
  limit: number;
  sort: string;
  status: string | undefined;
  skip: number;
}): Promise<CustomerOrdersResult> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { userId: Number(userId) },
      select: { customerId: true },
    });
    if (!customer) {
      throw new Error("Customer not found");
    }
    // Fetch all customer orders--
    const orders = await prisma.order.findMany({
      where: {
        customerId: customer.customerId,
        ...(status ? { status: status as OrderStatus } : {}),
      },
      include: {
        orderItems: {
          select: {
            quantity: true,
            product: true,
          },
        },
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

    const processedOrdersWithImageUrls = await Promise.all(
      orders.map(async (order) => {
        const updatedOrderItems = await Promise.all(
          order.orderItems.map(async (item) => {
            const accessibleUrls =
              item.product.imageUrls.length > 0
                ? await getBatchAccessibleImageUrls(
                    item.product.imageUrls,
                    item.product.isPrivateImages,
                    300
                  )
                : [];

            return {
              ...item.product,
              accessibleImageUrls: accessibleUrls,
              quantity: item.quantity,
            };
          })
        );
        return {
          ...order,
          totalAmount: order.totalAmount,
          orderItems: updatedOrderItems,
        };
      })
    );

    const totalOrders = await prisma.order.count({
      where: {
        customerId: customer.customerId,
        ...(status ? { status: status as OrderStatus } : {}),
      },
    });

    return {
      orders: processedOrdersWithImageUrls,
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
