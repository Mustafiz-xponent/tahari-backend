import axios from "axios";
import prisma from "@/prisma-client/prismaClient";
import { getErrorMessage } from "@/utils/errorHandler";
import { WalletDepositeResult } from "@/modules/wallets/wallet.interface";

/**
 * Process payment through SSLCommerz
 */
export async function processSSLCommerzWalletDeposite(
  customer: any,
  amount: number
): Promise<WalletDepositeResult> {
  try {
    // Initialize SSLCommerz payment
    const sslcommerzResponse = await initializeSSLCommerzPayment({
      walletId: customer.wallet.walletId,
      amount,
      customerEmail: customer.user.email,
      customerPhone: customer.user.phone,
      customerName: customer.user.name,
    });

    // Validate SSLCommerz response
    if (!sslcommerzResponse || sslcommerzResponse.status !== "SUCCESS") {
      throw new Error(
        `SSLCommerz initialization failed: ${
          sslcommerzResponse?.failedreason || "Unknown error"
        }`
      );
    }
    // Create pending wallet transaction
    const walletTransaction = await prisma.walletTransaction.create({
      data: {
        amount,
        transactionType: "DEPOSIT",
        transactionStatus: "PENDING",
        description: `Wallet deposit of ${amount} BDT. Transaction ID: ${sslcommerzResponse.transactionId}`, // Transaction ID is required for further processing
        walletId: customer.wallet.walletId,
      },
    });
    return {
      walletTransaction,
      redirectUrl: sslcommerzResponse.redirectGatewayURL,
    };
  } catch (error) {
    throw new Error(`SSLCommerz payment failed: ${getErrorMessage(error)}`);
  }
}

/**
 *  SSLCommerz payment gateway initialization using direct API calls
 */
async function initializeSSLCommerzPayment(data: {
  walletId: bigint;
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

    const transactionId = `WALLET_${data.walletId}_${Date.now()}`;

    // Prepare payment data for SSLCommerz API
    const paymentData = {
      store_id: process.env.SSLCOMMERZ_STORE_ID,
      store_passwd: process.env.SSLCOMMERZ_STORE_PASSWD,
      total_amount: Number(data.amount).toFixed(2),
      currency: "BDT",
      tran_id: transactionId,
      success_url: `${process.env.SERVER_URL}/api/wallets/deposite/success`,
      fail_url: `${process.env.SERVER_URL}/api/wallets/deposite/fail`,
      cancel_url: `${process.env.SERVER_URL}/api/wallets/deposite/cancel`,
      ipn_url: `${process.env.SERVER_URL}/api/wallets/deposite/ipn`,
      shipping_method: "NO",
      product_name: "Wallet Deposit",
      product_category: "Digital",
      product_profile: "digital-goods",
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
        redirectGatewayURL: response.data.GatewayPageURL,
        failedreason: null,
        transactionId,
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
    if (axios.isAxiosError(error)) {
      // Handle specific HTTP errors
      if (error.response?.status === 400) {
        throw new Error(
          `SSLCommerz API Bad Request: ${
            error.response.data?.failedreason || "Invalid request parameters"
          }`
        );
      } else if (error.response?.status === 401) {
        throw new Error(
          "SSLCommerz API Authentication failed: Invalid store credentials"
        );
      } else if (error.response?.status! >= 500) {
        throw new Error("SSLCommerz API server error: Please try again later");
      } else {
        throw new Error(`SSLCommerz API request failed: ${error.message}`);
      }
    }
    const code = (error as any).code;
    // Handle network errors
    if (code === "ECONNABORTED") {
      throw new Error("SSLCommerz API timeout: Request took too long");
    } else if (code === "ENOTFOUND" || code === "ECONNREFUSED") {
      throw new Error("SSLCommerz API connection failed: Network error");
    }
    throw error;
  }
}
