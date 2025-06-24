import { CreatePaymentDto } from "@/modules/payments/payment.dto";
import prisma from "../prisma-client/prismaClient";
import { Payment } from "../../generated/prisma/client";
import { getErrorMessage } from "./errorHandler";
import axios from "axios";

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
    // Initialize SSLCommerz payment using manual implementation
    const sslcommerzResponse = await initializeSSLCommerzPayment({
      orderId: data.orderId,
      amount: order.totalAmount,
      customerEmail: order.customer.user.email,
      customerPhone: order.customer.user.phone,
      customerName: order.customer.user.name,
    });

    // Validate SSLCommerz response
    if (!sslcommerzResponse || sslcommerzResponse.status !== "SUCCESS") {
      throw new Error(
        `SSLCommerz initialization failed: ${
          sslcommerzResponse?.failedreason || "Unknown error"
        }`
      );
    }

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
    console.error("SSLCommerz payment processing error:", error);
    throw new Error(`SSLCommerz payment failed: ${getErrorMessage(error)}`);
  }
}

/**
 *  SSLCommerz payment gateway initialization using direct API calls
 */
async function initializeSSLCommerzPayment(data: {
  orderId: bigint;
  amount: number;
  customerEmail?: string;
  customerPhone: string;
  customerName?: string;
}) {
  try {
    // Validate environment variables
    if (
      !process.env.SSLCOMMERZ_STORE_ID ||
      !process.env.SSLCOMMERZ_STORE_PASSWD
    ) {
      throw new Error("SSLCommerz credentials not configured");
    }

    // Determine the base URL based on environment
    const isLive = process.env.NODE_ENV === "production";
    const baseUrl = isLive
      ? "https://securepay.sslcommerz.com"
      : "https://sandbox.sslcommerz.com";

    const transactionId = `ORDER_${data.orderId}_${Date.now()}`;

    // Prepare payment data for SSLCommerz API
    const paymentData = {
      store_id: process.env.SSLCOMMERZ_STORE_ID,
      store_passwd: process.env.SSLCOMMERZ_STORE_PASSWD,
      total_amount: Number(data.amount).toFixed(2),
      currency: "BDT",
      tran_id: transactionId,
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

    // Make the API call to SSLCommerz
    const response = await axios.post(
      `${baseUrl}/gwprocess/v4/api.php`,
      new URLSearchParams(paymentData).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        timeout: 30000, // 30 seconds timeout
      }
    );

    // Check if the response is successful
    if (response.data.status === "SUCCESS") {
      return {
        status: "SUCCESS",
        sessionkey: response.data.sessionkey,
        redirectGatewayURL: response.data.redirectGatewayURL,
        failedreason: null,
      };
    } else {
      return {
        status: "FAILED",
        sessionkey: null,
        redirectGatewayURL: null,
        failedreason:
          response.data.failedreason || "Unknown error from SSLCommerz",
      };
    }
  } catch (error: unknown) {
    // if (axios.isAxiosError(error)) {
    //   console.error("SSLCommerz API request failed:", {
    //     status: error.response?.status,
    //     statusText: error.response?.statusText,
    //     data: error.response?.data,
    //     message: error.message,
    //     code: error.code,
    //   });

    //   // Handle specific HTTP errors
    //   if (error.response?.status === 400) {
    //     throw new Error(
    //       `SSLCommerz API Bad Request: ${
    //         error.response.data?.failedreason || "Invalid request parameters"
    //       }`
    //     );
    //   } else if (error.response?.status === 401) {
    //     throw new Error(
    //       "SSLCommerz API Authentication failed: Invalid store credentials"
    //     );
    //   } else if (error.response?.status >= 500) {
    //     throw new Error("SSLCommerz API server error: Please try again later");
    //   } else {
    //     throw new Error(`SSLCommerz API request failed: ${error.message}`);
    //   }
    // }

    // Handle network errors
    // if (error.code === "ECONNABORTED") {
    //   throw new Error("SSLCommerz API timeout: Request took too long");
    // } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
    //   throw new Error("SSLCommerz API connection failed: Network error");
    // }

    throw error;
  }
}

/**
 * Validate SSLCommerz payment
 */
export async function validateSSLCommerzPayment(validationData: any) {
  try {
    const isLive = process.env.NODE_ENV === "production";
    const baseUrl = isLive
      ? "https://securepay.sslcommerz.com"
      : "https://sandbox.sslcommerz.com";

    const validationParams = {
      store_id: process.env.SSLCOMMERZ_STORE_ID!,
      store_passwd: process.env.SSLCOMMERZ_STORE_PASSWD!,
      val_id: validationData.val_id,
    };

    const response = await axios.post(
      `${baseUrl}/validator/api/validationserverAPI.php`,
      new URLSearchParams(validationParams).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        timeout: 30000,
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
}
