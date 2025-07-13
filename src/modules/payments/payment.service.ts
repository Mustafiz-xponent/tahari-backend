/**
 * Service layer for Payment entity operations.
 * Contains business logic and database interactions for payments.
 */
import prisma from "@/prisma-client/prismaClient";
import { Payment } from "@/generated/prisma/client";
import {
  CreatePaymentDto,
  UpdatePaymentDto,
} from "@/modules/payments/payment.dto";
import { getErrorMessage } from "@/utils/errorHandler";
import {
  processWalletPayment,
  processSSLCommerzPayment,
  processCodPayment,
  validateSSLCommerzPayment,
} from "@/utils/processPayment";
import * as notificationService from "@/modules/notifications/notification.service";
import { getOrderStatusMessage } from "@/utils/getOrderStatusMessage";
import logger from "@/utils/logger";

/**
 * create order payment through wallet or SSLCommerz
 * @param data - Payment processing data
 * @returns Payment result
 */
export interface PaymentResult {
  success?: boolean;
  message?: string;
  payment?: Payment;
  redirectUrl?: string; // For SSLCommerz redirect
}
export async function createPayment(
  data: CreatePaymentDto
): Promise<PaymentResult> {
  try {
    // Validate order exists and is pending payment
    const order = await prisma.order.findUnique({
      where: { orderId: Number(data.orderId) },
      include: {
        customer: {
          include: {
            wallet: true,
            user: true,
          },
        },
        orderItems: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (!["PENDING", "FAILED"].includes(order.paymentStatus)) {
      throw new Error(
        `Order is not payable. Current status: ${order.paymentStatus}`
      );
    }

    if (order.paymentMethod.toUpperCase() === "WALLET") {
      return await processWalletPayment(data, order);
    } else if (order.paymentMethod.toUpperCase() === "SSLCOMMERZ") {
      return await processSSLCommerzPayment(data, order);
    } else if (order.paymentMethod.toUpperCase() === "COD") {
      return await processCodPayment(data, order);
    } else {
      throw new Error("Invalid payment method");
    }
  } catch (error) {
    throw new Error(`Failed to create payment: ${getErrorMessage(error)}`);
  }
}

export async function handleSSLCommerzSuccess(
  validationData: any
): Promise<PaymentResult> {
  try {
    // Validate payment with SSLCommerz  implementation
    const validation = await validateSSLCommerzPayment(validationData);

    if (["VALID", "VALIDATED"].includes(validation.status)) {
      // Extract order ID from transaction ID
      const tranId = validationData.tran_id;
      const orderIdMatch = tranId.match(/ORDER_(\d+)_/);
      if (!orderIdMatch) {
        throw new Error("Invalid transaction ID format");
      }

      const orderId = BigInt(orderIdMatch[1]);

      // Update payment and order in transaction
      return await prisma.$transaction(async (tx) => {
        // Check payment status
        const payment = await tx.payment.findFirst({
          where: {
            orderId: Number(orderId),
            transactionId: tranId,
          },
        });

        if (!payment) throw new Error("Payment record not found");
        if (payment.paymentStatus === "COMPLETED") {
          return {
            success: true,
            message: "Payment was already processed successfully",
          };
        }

        if (payment.paymentStatus !== "PENDING") {
          throw new Error(
            `Cannot complete payment with status: ${payment.paymentStatus}`
          );
        }
        // Mark payment as COMPLETED
        await tx.payment.update({
          where: { paymentId: payment.paymentId },
          data: {
            paymentStatus: "COMPLETED",
            transactionId: tranId,
          },
        });
        // Fetch the order
        const order = await tx.order.findUnique({
          where: { orderId },
          include: {
            orderItems: true,
            customer: {
              include: {
                user: true,
              },
            },
          },
        });

        if (!order) throw new Error("Order not found");
        //  Update order
        const updatedOrder = await tx.order.update({
          where: { orderId },
          data: {
            paymentStatus: "COMPLETED",
            status: "CONFIRMED",
          },
        });

        //  Track status change
        await tx.orderTracking.create({
          data: {
            orderId,
            status: "CONFIRMED",
            description: "Order confirmed and payment completed via SSLCommerz",
          },
        });

        // Reduce stock and log transaction
        for (const item of order.orderItems) {
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
              orderId,
              description: `Stock reduced for Order #${orderId} - SSLCommerz payment`,
            },
          });
        }
        const message = getOrderStatusMessage(
          updatedOrder.status,
          updatedOrder.orderId
        );
        await notificationService.createNotification({
          message,
          receiverId: order.customer.userId,
        });
        return {
          success: true,
          message: "SSLCommerz payment completed successfully",
        };
      });
    } else {
      throw new Error(
        `Payment validation failed: ${
          validation.failedreason || "Unknown validation error"
        }`
      );
    }
  } catch (error) {
    throw new Error(
      `SSLCommerz success handling failed: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Get order payment status for user callbacks
 */
export async function getOrderPaymentStatus(tranId: string): Promise<{
  orderId: number;
  paymentStatus: string;
  orderStatus: string;
}> {
  try {
    const orderIdMatch = tranId.match(/ORDER_(\d+)_/);
    if (!orderIdMatch) {
      throw new Error("Invalid transaction ID format");
    }

    const orderId = Number(orderIdMatch[1]);

    const payment = await prisma.payment.findFirst({
      where: {
        orderId,
        transactionId: tranId,
      },
      include: {
        order: {
          select: {
            status: true,
            paymentStatus: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    return {
      orderId,
      paymentStatus: payment.paymentStatus,
      orderStatus: payment.order.status,
    };
  } catch (error) {
    throw new Error(`Failed to get payment status: ${getErrorMessage(error)}`);
  }
}
/**
 * Handle SSLCommerz payment failure
 */
export async function handleSSLCommerzFailure(failureData: any): Promise<void> {
  try {
    // Extract order ID and update payment status
    const tranId = failureData.tran_id;
    const orderIdMatch = tranId.match(/ORDER_(\d+)_/);
    if (!orderIdMatch) {
      throw new Error("Invalid transaction ID format");
    }

    const orderId = Number(orderIdMatch[1]);
    await prisma.$transaction(async (tx) => {
      // Find the specific payment record
      const payment = await tx.payment.findFirst({
        where: {
          orderId,
          transactionId: tranId,
        },
      });

      if (!payment) {
        throw new Error(`No matching payment found for orderId ${orderId}`);
      }

      if (payment.paymentStatus === "FAILED") {
        // Already failed, nothing to do
        return;
      }

      if (payment.paymentStatus !== "PENDING") {
        throw new Error(
          `Cannot mark payment as FAILED — current status is ${payment.paymentStatus}`
        );
      }

      // Mark payment as FAILED
      await tx.payment.update({
        where: { paymentId: payment.paymentId },
        data: { paymentStatus: "FAILED" },
      });

      // Update order status if still pending
      const order = await tx.order.findUnique({
        where: { orderId },
        include: { customer: true },
      });

      if (!order) throw new Error("Order not found");

      if (order && order.paymentStatus === "PENDING") {
        await tx.order.update({
          where: { orderId },
          data: { paymentStatus: "FAILED" },
        });
      }
      await notificationService.createNotification({
        message: `দুঃখিত! আপনার অর্ডারটি সম্পন্ন করা যায়নি কারণ পেমেন্ট সফল হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন। অর্ডার আইডিঃ #${order.orderId}`,
        receiverId: order.customer.userId,
      });
    });
  } catch (error) {
    console.error("handleSSLCommerzFailure error:", error);
    throw new Error(
      `Failed to handle SSLCommerz payment: ${getErrorMessage(error)}`
    );
  }
}
/**
 * Retrieve all payments
 */
export async function getAllPayments(): Promise<Payment[]> {
  try {
    const payments = await prisma.payment.findMany();
    return payments;
  } catch (error) {
    throw new Error(`Failed to fetch payments: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieve a payment by its ID
 */
export async function getPaymentById(
  paymentId: BigInt
): Promise<Payment | null> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { paymentId: Number(paymentId) },
    });
    return payment;
  } catch (error) {
    throw new Error(`Failed to fetch payment: ${getErrorMessage(error)}`);
  }
}

/**
 * Update a payment by its ID
 */
export async function updatePayment(
  paymentId: BigInt,
  data: UpdatePaymentDto
): Promise<Payment> {
  try {
    if (data.orderId) {
      const order = await prisma.order.findUnique({
        where: { orderId: Number(data.orderId) },
      });
      if (!order) {
        throw new Error("Order not found");
      }
    }

    if (data.walletTransactionId) {
      const walletTransaction = await prisma.walletTransaction.findUnique({
        where: { transactionId: Number(data.walletTransactionId) },
      });
      if (!walletTransaction) {
        throw new Error("Wallet transaction not found");
      }
    }

    const payment = await prisma.payment.update({
      where: { paymentId: Number(paymentId) },
      data: {
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        transactionId: data.transactionId,
        orderId: data.orderId,
        walletTransactionId: data.walletTransactionId,
      },
    });
    return payment;
  } catch (error) {
    throw new Error(`Failed to update payment: ${getErrorMessage(error)}`);
  }
}

/**
 * Delete a payment by its ID
 */
export async function deletePayment(paymentId: BigInt): Promise<void> {
  try {
    await prisma.payment.delete({
      where: { paymentId: Number(paymentId) },
    });
  } catch (error) {
    throw new Error(`Failed to delete payment: ${getErrorMessage(error)}`);
  }
}
