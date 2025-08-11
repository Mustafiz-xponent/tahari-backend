/**
 * Service layer for Wallet entity operations.
 * Contains business logic and database interactions for wallets.
 */

import prisma from "@/prisma-client/prismaClient";
import { Wallet, WalletTransaction } from "@/generated/prisma/client";
import { CreateWalletDto, UpdateWalletDto } from "@/modules/wallets/wallet.dto";
import { getErrorMessage } from "@/utils/errorHandler";
import { processSSLCommerzWalletDeposite } from "@/utils/processWalletDeposite";
import {
  createNotification,
  validateSSLCommerzPayment,
} from "@/utils/processPayment";
import { IDepositData } from "@/modules/wallets/wallet.interface";

/**
 * Create a new wallet
 * @param data - Data required to create a wallet
 * @returns The created wallet
 * @throws Error if the wallet cannot be created (e.g., duplicate customerId or invalid foreign key)
 */
export async function createWallet(data: CreateWalletDto): Promise<Wallet> {
  try {
    // Check if a wallet already exists for the customer
    const existingWallet = await prisma.wallet.findUnique({
      where: { customerId: data.customerId },
    });
    if (existingWallet) {
      throw new Error("A wallet already exists for this customer");
    }

    const wallet = await prisma.wallet.create({
      data: {
        customerId: data.customerId,
        balance: 0.0, // Default balance as per model
      },
    });
    return wallet;
  } catch (error) {
    throw new Error(`Failed to create wallet: ${getErrorMessage(error)}`);
  }
}

export async function initiateDeposit({
  userId,
  amount,
}: {
  userId: number;
  amount: number;
}): Promise<IDepositData> {
  try {
    // Get customer details
    const customer = await prisma.customer.findUnique({
      where: { userId: Number(userId) },
      include: {
        user: true,
        wallet: true,
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Create or get wallet
    let wallet = customer.wallet;
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          customerId: customer.customerId,
          balance: 0.0,
        },
      });
    }

    if (wallet) {
      return await processSSLCommerzWalletDeposite(customer, amount);
    } else {
      throw new Error("Wallet not found");
    }
  } catch (error) {
    throw new Error(`Failed to initiate deposit: ${getErrorMessage(error)}`);
  }
}

export async function handleDepositeSuccess(
  validationData: any
): Promise<{ success: boolean; message: string }> {
  try {
    // Validate payment with SSLCommerz  implementation
    const validation = await validateSSLCommerzPayment(validationData);

    if (["VALID", "VALIDATED"].includes(validation.status)) {
      // Extract wallet ID
      const tranId = validationData.tran_id;

      // Find the wallet transaction
      const walletTransaction = await prisma.walletTransaction.findFirst({
        where: {
          description: { contains: tranId },
          transactionStatus: "PENDING",
        },
        include: {
          wallet: true,
        },
      });

      if (!walletTransaction) {
        throw new Error("Wallet transaction not found");
      }

      // Update wallet and wallet trasaction
      return await prisma.$transaction(async (tx) => {
        // Update wallet transaction status
        await tx.walletTransaction.update({
          where: { transactionId: walletTransaction.transactionId },
          data: {
            transactionStatus: "COMPLETED",
            description: `Trasaction completed by SSLCommerz. TransactionId: ${tranId}`,
          },
        });
        // Update wallet balance
        const updatedWallet = await tx.wallet.update({
          where: { walletId: walletTransaction.walletId },
          data: {
            balance: {
              increment: walletTransaction.amount,
            },
            updatedAt: new Date(),
          },
          include: {
            customer: true,
          },
        });
        // notify the user--
        const message = `অভিনন্দন! আপনার ওয়ালেটে ${walletTransaction.amount} টাকা সফলভাবে জমা হয়েছে। ধন্যবাদ আমাদের সাথে থাকার জন্য। (লেনদেন আইডি: ${tranId})`;
        await createNotification(
          message,
          "WALLET",
          updatedWallet.customer.userId,
          tx
        );

        return {
          success: true,
          message: "Wallet deposite completed successfully.",
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
    console.error(error);
    throw new Error(
      `SSLCommerz success handling failed: ${getErrorMessage(error)}`
    );
  }
}
export async function getPaymentStatus(tranId: string): Promise<string> {
  try {
    const transaction = await prisma.walletTransaction.findFirst({
      where: { description: { contains: tranId } },
      select: { transactionStatus: true },
    });

    return transaction?.transactionStatus || "NOT_FOUND";
  } catch (error) {
    console.error("Error getting payment status:", error);
    return "ERROR";
  }
}
/**
 * Handle SSLCommerz payment failure
 */
export async function handleDepositeFailure(failureData: any): Promise<void> {
  try {
    // Extract order ID and update payment status
    const tranId = failureData.tran_id;

    // Find and update the wallet transaction
    const walletTransaction = await prisma.walletTransaction.findFirst({
      where: {
        description: { contains: tranId },
        transactionStatus: "PENDING",
      },
      include: {
        wallet: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (walletTransaction) {
      await prisma.$transaction(async (tx) => {
        await tx.walletTransaction.update({
          where: { transactionId: walletTransaction.transactionId },
          data: {
            transactionStatus: "FAILED",
            description: `Wallet deposite failed. TransactionId: ${tranId}`,
          },
        });
        const message = `দুঃখিত! আপনার ওয়ালেটে টাকা জমা দেওয়া সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন বা সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন।`;
        await createNotification(
          message,
          "WALLET",
          walletTransaction.wallet.customer.userId,
          tx
        );
      });
    }
  } catch (error) {
    console.error("handleSSLCommerzFailure error:", error);
    throw new Error(
      `Failed to handle SSLCommerz payment: ${getErrorMessage(error)}`
    );
  }
}
/**
 * Retrieve all wallets
 * @returns An array of all wallets
 * @throws Error if the query fails
 */
export async function getAllWallets(): Promise<Wallet[]> {
  try {
    const wallets = await prisma.wallet.findMany();
    return wallets;
  } catch (error) {
    throw new Error(`Failed to fetch wallets: ${getErrorMessage(error)}`);
  }
}
/**
 * Retrieve a wallet by its ID
 * @param userId - The ID of the user
 * @returns The wallet if found, or null if not found
 * @throws Error if the query fails
 */
export async function getCustomerWalletBalanace(
  userId: BigInt
): Promise<Wallet | null> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { userId: Number(userId) },
      include: { wallet: true },
    });
    if (!customer) {
      throw new Error("Customer not found");
    }
    const wallet = await prisma.wallet.findUnique({
      where: { walletId: customer.wallet?.walletId },
    });
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    return wallet;
  } catch (error) {
    throw new Error(`Failed to fetch wallet: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieve a wallet by its ID
 * @param walletId - The ID of the wallet
 * @returns The wallet if found, or null if not found
 * @throws Error if the query fails
 */
export async function getWalletById(walletId: BigInt): Promise<Wallet | null> {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { walletId: Number(walletId) },
    });
    if (!wallet) {
      throw new Error("Wallet not found");
    }
    const customer = await prisma.customer.findUnique({
      where: { userId: wallet?.customerId },
      include: { wallet: true },
    });
    if (!customer) {
      throw new Error("Customer not found");
    }
    return wallet;
  } catch (error) {
    throw new Error(`Failed to fetch wallet: ${getErrorMessage(error)}`);
  }
}

/**
 * Update a wallet by its ID
 * @param walletId - The ID of the wallet to update
 * @param data - Data to update the wallet
 * @returns The updated wallet
 * @throws Error if the wallet is not found, update fails, or customerId is already assigned
 */
export async function updateWallet(
  walletId: BigInt,
  data: UpdateWalletDto
): Promise<Wallet> {
  try {
    // If updating customerId, check for existing wallet with that customerId
    if (data.customerId) {
      const existingWallet = await prisma.wallet.findUnique({
        where: { customerId: data.customerId },
      });
      if (existingWallet && existingWallet.walletId !== walletId) {
        throw new Error("A wallet already exists for this customer");
      }
    }

    const wallet = await prisma.wallet.update({
      where: { walletId: Number(walletId) },
      data: {
        customerId: data.customerId,
        balance: data.balance,
      },
    });
    return wallet;
  } catch (error) {
    throw new Error(`Failed to update wallet: ${getErrorMessage(error)}`);
  }
}

/**
 * Delete a wallet by its ID
 * @param walletId - The ID of the wallet to delete
 * @throws Error if the wallet is not found or deletion fails
 */
export async function deleteWallet(walletId: BigInt): Promise<void> {
  try {
    await prisma.wallet.delete({
      where: { walletId: Number(walletId) },
    });
  } catch (error) {
    throw new Error(`Failed to delete wallet: ${getErrorMessage(error)}`);
  }
}
