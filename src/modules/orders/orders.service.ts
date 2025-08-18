/**
 * Service layer for Order entity operations.
 * Contains business logic and database interactions for orders.
 */

import prisma from "@/prisma-client/prismaClient";
import { Order, OrderStatus } from "@/generated/prisma/client";
import { CreateOrderDto, UpdateOrderDto } from "@/modules/orders/orders.dto";
import { getErrorMessage } from "@/utils/errorHandler";
import { getBatchAccessibleImageUrls } from "@/utils/fileUpload/s3Aws";
import { getOrderStatusMessage } from "@/utils/getOrderStatusMessage";
import { createNotification } from "@/utils/processPayment";
import {
  hasInsufficientWalletBalance,
  upcomingDelivery,
} from "@/utils/processSubscription";

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
          description: "Order created pending",
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

interface OrderFilters {
  status?: OrderStatus;
  customerId?: bigint;
  skip?: number;
  take?: number;
  sort?: "asc" | "desc";
}

export async function getAllOrders(filters: OrderFilters): Promise<Order[]> {
  try {
    const { status, customerId, skip, take, sort } = filters;
    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (customerId) whereClause.customerId = customerId;
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
      skip,
      take,
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
  orderId: bigint,
  data: UpdateOrderDto
): Promise<Order> {
  try {
    // Get current order
    const currentOrder = await prisma.order.findUnique({
      where: { orderId },
      include: {
        customer: { include: { wallet: true } },
        orderItems: true,
      },
    });
    if (!currentOrder) throw new Error("Order not found");
    if (currentOrder.status === "DELIVERED" && data.status) {
      throw new Error("Cannot update status after it has been delivered.");
    }
    return await prisma.$transaction(async (tx) => {
      // Update order
      const isDelivered = data.status === "DELIVERED";
      const updatedOrder = await tx.order.update({
        where: { orderId },
        data: {
          status: data.status,
          paymentStatus:
            data.paymentStatus ??
            (isDelivered ? "COMPLETED" : currentOrder.paymentStatus),
          shippingAddress: data.shippingAddress,
          preorderDeliveryDate: currentOrder.isPreorder
            ? data.preorderDeliveryDate
            : currentOrder.preorderDeliveryDate,
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
              orderId,
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
            orderId,
            status: data.status,
          },
        });
        if (!alreadyTracked) {
          await tx.orderTracking.create({
            data: {
              orderId,
              status: data.status,
              description: `Status updated to ${data.status}`,
            },
          });
        }
        const message = getOrderStatusMessage(data.status, orderId);
        await createNotification(
          message,
          "ORDER",
          currentOrder.customer.userId,
          tx
        );
      }
      if (data.status === "DELIVERED" && currentOrder.paymentMethod === "COD") {
        await Promise.all(
          currentOrder.orderItems.map(async (item) => {
            await tx.product.update({
              where: { productId: item.productId },
              data: {
                stockQuantity: {
                  decrement: item.quantity * item.packageSize,
                },
              },
            });

            await tx.stockTransaction.create({
              data: {
                quantity: item.quantity * item.packageSize,
                transactionType: "OUT",
                productId: item.productId,
                orderId: Number(orderId),
                description: `Stock reduced for Order #${orderId}`,
              },
            });
          })
        );

        // update payment record
        await tx.payment.update({
          where: { orderId, paymentMethod: "COD" },
          data: {
            paymentStatus: "COMPLETED",
          },
        });
      }
      if (currentOrder.isSubscription) {
        // Update subscription delivery
        const updatedSubscriptionDelivery =
          await tx.subscriptionDelivery.update({
            where: { orderId },
            data: { status: data.status },
          });
        if (data.status === "DELIVERED") {
          const subscriptionId = updatedSubscriptionDelivery.subscriptionId;
          const delivery = await upcomingDelivery(tx, subscriptionId);
          let nextDeliveryDate: Date | null;
          if (delivery) {
            nextDeliveryDate = delivery.deliveryDate;
          } else {
            nextDeliveryDate = null;
          }
          // update subscription delivery date
          await tx.subscription.update({
            where: { subscriptionId },
            data: { nextDeliveryDate },
          });
        }
        if (
          currentOrder.paymentMethod === "WALLET" &&
          data.status === "DELIVERED"
        ) {
          if (
            hasInsufficientWalletBalance(
              currentOrder.customer.wallet,
              currentOrder.totalAmount
            )
          ) {
            throw new Error(`Insufficient wallet balance`);
          }
          // deduct wallet balance
          await tx.wallet.update({
            where: { walletId: currentOrder.customer.wallet?.walletId },
            data: {
              lockedBalance: { decrement: currentOrder.totalAmount },
              balance: { decrement: currentOrder.totalAmount },
            },
          });
          // update wallet transaction record
          await tx.walletTransaction.update({
            where: { orderId },
            data: {
              transactionStatus: "COMPLETED",
              description: `Payment completed for order #${currentOrder.orderId}`,
            },
          });
          // update payment record
          await tx.payment.update({
            where: { orderId },
            data: { paymentStatus: "COMPLETED" },
          });
        }
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
  statusArray,
  skip,
}: {
  userId: BigInt;
  page: number;
  limit: number;
  sort: string;
  statusArray: string[];
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
        ...(statusArray.length > 0 && {
          status: { in: statusArray as OrderStatus[] },
        }),
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
        ...(statusArray.length > 0 && {
          status: { in: statusArray as OrderStatus[] },
        }),
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
