import { CreatePaymentDto } from "@/modules/payments/payment.dto";
import prisma from "../prisma-client/prismaClient";
import { Payment } from "../../generated/prisma/client";
import { getErrorMessage } from "./errorHandler";

export interface PaymentResult {
  payment?: Payment;
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
      payment,
    };
  });
}
/**
 * Process payment through SSLCommerz
 */
export async function processSSLCommerzPayment(
  data: CreatePaymentDto,
  order: any
): Promise<PaymentResult> {
  try {
    // Initialize SSLCommerz payment
    const sslcommerzResponse = await initializeSSLCommerzPayment({
      orderId: data.orderId,
      amount: order.totalAmount,
      customerEmail: order.customer.user.email,
      customerPhone: order.customer.user.phone,
      customerName: order.customer.user.name,
    });
    // Create pending payment record
    const payment = await prisma.payment.create({
      data: {
        amount: order.totalAmount,
        paymentMethod: "SSLCOMMERZ",
        paymentStatus: "PENDING",
        transactionId: sslcommerzResponse.sessionkey,
        orderId: Number(data.orderId),
      },
    });

    return {
      payment,
      redirectUrl: sslcommerzResponse.redirectGatewayURL,
    };
  } catch (error) {
    throw new Error(`SSLCommerz payment failed: ${getErrorMessage(error)}`);
  }
}

/**
 * Initialize SSLCommerz payment gateway
 */
async function initializeSSLCommerzPayment(data: {
  orderId: bigint;
  amount: number;
  customerEmail?: string;
  customerPhone: string;
  customerName?: string;
}) {
  // SSLCommerz configuration
  const SSLCommerzPayment = require("sslcommerz-lts");

  const sslcz = new SSLCommerzPayment(
    process.env.SSLCOMMERZ_STORE_ID,
    process.env.SSLCOMMERZ_STORE_PASSWD,
    process.env.NODE_ENV === "production" // is_live
  );
  const paymentData = {
    total_amount: data.amount,
    currency: "BDT",
    tran_id: `ORDER_${data.orderId}_${Date.now()}`,
    success_url: `${process.env.SERVER_URL}/api/payments/sslcommerz/success`,
    fail_url: `${process.env.SERVER_URL}/api/payments/sslcommerz/fail`,
    cancel_url: `${process.env.SERVER_URL}/api/payments/sslcommerz/cancel`,
    ipn_url: `${process.env.SERVER_URL}/api/payments/sslcommerz/ipn`,
    shipping_method: "Courier",
    product_name: `Order Payment #${data.orderId}`,
    product_category: "Food",
    product_profile: "general",
    cus_name: data.customerName || "Customer",
    cus_email: data.customerEmail || "customer@example.com",
    cus_add1: "N/A",
    cus_city: "Chittagong",
    cus_state: "Chittagong",
    cus_postcode: "1000",
    cus_country: "Bangladesh",
    cus_phone: data.customerPhone,
    ship_name: data.customerName || "Customer",
    ship_add1: "N/A",
    ship_city: "Chittagong",
    ship_state: "Chittagong",
    ship_postcode: "1000",
    ship_country: "Bangladesh",
  };
  return await sslcz.init(paymentData);
}
