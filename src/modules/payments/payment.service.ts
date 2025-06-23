/**
 * Service layer for Payment entity operations.
 * Contains business logic and database interactions for payments.
 */

import prisma from "../../prisma-client/prismaClient";
import { Payment, WalletTransaction } from "../../../generated/prisma/client";
import { CreatePaymentDto, UpdatePaymentDto } from "./payment.dto";
import { getErrorMessage } from "../../utils/errorHandler";
import { processWalletPayment } from "../../utils/processPayment";

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
  success: boolean;
  payment?: Payment;
  walletTransaction?: WalletTransaction;
  message: string;
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
    } else {
      throw new Error("Invalid payment method");
    }
  } catch (error) {
    throw new Error(`Failed to create payment: ${getErrorMessage(error)}`);
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
