/**
 * Service layer for Payment entity operations.
 * Contains business logic and database interactions for payments.
 */
import prisma from "../../prisma-client/prismaClient";
import { Payment } from "../../../generated/prisma/client";
import { CreatePaymentDto, UpdatePaymentDto } from "./payment.dto";
import { getErrorMessage } from "../../utils/errorHandler";
import {
  processWalletPayment,
  processSSLCommerzPayment,
} from "../../utils/processPayment";

/**
 * Create a new payment
 */
// export async function createPayment(data: CreatePaymentDto): Promise<Payment> {
//   try {
//     const order = await prisma.order.findUnique({
//       where: { orderId: Number(data.orderId) },
//     });

//     if (!order) {
//       throw new Error("Order not found");
//     }

//     if (data.walletTransactionId) {
//       const walletTransaction = await prisma.walletTransaction.findUnique({
//         where: { transactionId: Number(data.walletTransactionId) },
//       });
//       if (!walletTransaction) {
//         throw new Error("Wallet transaction not found");
//       }
//     }

//     const payment = await prisma.payment.create({
//       data: {
//         amount: data.amount,
//         paymentMethod: data.paymentMethod,
//         paymentStatus: data.paymentStatus,
//         transactionId: data.transactionId,
//         orderId: data.orderId,
//         walletTransactionId: data.walletTransactionId,
//       },
//     });
//     return payment;
//   } catch (error) {
//     throw new Error(`Failed to create payment: ${getErrorMessage(error)}`);
//   }
// }

/**
 * create order payment through wallet or SSLCommerz
 * @param data - Payment processing data
 * @returns Payment result with success status
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

    if (order.paymentStatus !== "PENDING") {
      throw new Error(
        `Order payment is already ${order.paymentStatus.toLowerCase()}`
      );
    }

    if (order.paymentMethod.toUpperCase() === "WALLET") {
      return await processWalletPayment(data, order);
    } else if (order.paymentMethod.toUpperCase() === "SSLCOMMERZ") {
      return await processSSLCommerzPayment(data, order);
    } else {
      throw new Error("Invalid payment method");
    }
  } catch (error) {
    console.log("error:", error);
    throw new Error(`Failed to create payment: ${getErrorMessage(error)}`);
  }
}
/**
 * Handle SSLCommerz payment success callback
 */
export async function handleSSLCommerzSuccess(
  validationData: any
): Promise<PaymentResult> {
  try {
    // Validate payment with SSLCommerz
    const SSLCommerzPayment = require("sslcommerz-lts");
    const sslcz = new SSLCommerzPayment(
      process.env.SSLCOMMERZ_STORE_ID,
      process.env.SSLCOMMERZ_STORE_PASSWD,
      process.env.NODE_ENV === "production"
    );

    const validation = await sslcz.validate(validationData);

    if (validation.status === "VALID") {
      // Extract order ID from transaction ID
      const tranId = validationData.tran_id;
      const orderIdMatch = tranId.match(/ORDER_(\d+)_/);

      if (!orderIdMatch) {
        throw new Error("Invalid transaction ID format");
      }

      const orderId = BigInt(orderIdMatch[1]);

      // Update payment and order in transaction
      return await prisma.$transaction(async (tx) => {
        // Update payment status
        const payment = await tx.payment.updateMany({
          where: {
            orderId: Number(orderId),
            paymentStatus: "PENDING",
          },
          data: {
            paymentStatus: "COMPLETED",
            transactionId: validationData.tran_id,
          },
        });

        // Update order status
        await tx.order.update({
          where: { orderId: Number(orderId) },
          data: {
            paymentStatus: "COMPLETED",
            status: "CONFIRMED",
          },
        });

        return {
          success: true,
          message: "SSLCommerz payment completed successfully",
          // payment,
        };
      });
    } else {
      throw new Error("Payment validation failed");
    }
  } catch (error) {
    throw new Error(
      `SSLCommerz success handling failed: ${getErrorMessage(error)}`
    );
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

    if (orderIdMatch) {
      const orderId = BigInt(orderIdMatch[1]);

      await prisma.$transaction(async (tx) => {
        // Update payment status to failed
        await tx.payment.updateMany({
          where: {
            orderId: Number(orderId),
            paymentStatus: "PENDING",
          },
          data: {
            paymentStatus: "FAILED",
          },
        });

        // Update order status
        await tx.order.update({
          where: { orderId: Number(orderId) },
          data: {
            paymentStatus: "FAILED",
          },
        });
      });
    }
  } catch (error) {
    console.error(
      "Failed to handle SSLCommerz failure:",
      getErrorMessage(error)
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
