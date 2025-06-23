import { CreatePaymentDto } from "@/modules/payments/payment.dto";
import prisma from "../prisma-client/prismaClient";
import { Payment, WalletTransaction } from "../../generated/prisma/client";
export interface PaymentResult {
  success: boolean;
  payment?: Payment;
  walletTransaction?: WalletTransaction;
  message: string;
  redirectUrl?: string; // For SSLCommerz redirect
}
/**
 * Process payment through customer wallet
 */
export async function processWalletPayment(
  data: CreatePaymentDto,
  order: any
): Promise<PaymentResult> {
  return await prisma.$transaction(async (tx) => {
    // Check if customer has wallet
    if (!order.customer.wallet) {
      throw new Error("Customer wallet not found");
    }

    // Check wallet balance
    if (Number(order.customer.wallet.balance) < Number(order.totalAmount)) {
      throw new Error("Insufficient wallet balance");
    }

    // Deduct amount from wallet
    await tx.wallet.update({
      where: { customerId: Number(order.customerId) },
      data: {
        balance: {
          decrement: order.totalAmount,
        },
      },
    });

    // Create wallet transaction record
    const walletTransaction = await tx.walletTransaction.create({
      data: {
        amount: order.totalAmount,
        transactionType: "PURCHASE",
        transactionStatus: "COMPLETED",
        description: `Payment for Order #${data.orderId}`,
        walletId: order.customer.wallet.walletId,
        orderId: Number(data.orderId),
      },
    });

    // Create payment record
    const payment = await tx.payment.create({
      data: {
        amount: order.totalAmount,
        paymentMethod: "WALLET",
        paymentStatus: "COMPLETED",
        orderId: Number(data.orderId),
        walletTransactionId: walletTransaction.transactionId,
      },
    });

    // Update order payment status
    await tx.order.update({
      where: { orderId: Number(data.orderId) },
      data: {
        paymentStatus: "COMPLETED",
        status: "CONFIRMED",
      },
    });
    // Track the order update
    await tx.orderTracking.create({
      data: {
        orderId: Number(data.orderId),
        status: "CONFIRMED",
        description: "Order confirmed and payment completed via wallet",
      },
    });

    for (const item of order.orderItems) {
      // Decrement product stock
      await tx.product.update({
        where: { productId: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      });

      // Create stock transaction record
      await tx.stockTransaction.create({
        data: {
          quantity: item.quantity,
          transactionType: "OUT",
          productId: item.productId,
          orderId: Number(data.orderId),
          description: `Stock reduced for Order #${data.orderId}`,
        },
      });
    }

    return {
      success: true,
      payment,
      walletTransaction,
      message: "Payment completed successfully through wallet",
    };
  });
}
