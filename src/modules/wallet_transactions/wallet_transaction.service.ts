/**
 * Service layer for WalletTransaction entity operations.
 * Contains business logic and database interactions for wallet transactions.
 */

import prisma from "@/prisma-client/prismaClient";
import { WalletTransaction } from "@/generated/prisma/client";
import {
  CreateWalletTransactionDto,
  UpdateWalletTransactionDto,
} from "@/modules/wallet_transactions/wallet_transaction.dto";
import { getErrorMessage } from "@/utils/errorHandler";

/**
 * Create a new wallet transaction
 * @param data - Data required to create a wallet transaction
 * @returns The created wallet transaction
 * @throws Error if the transaction cannot be created (e.g., invalid walletId or orderId)
 */
export async function createWalletTransaction(
  data: CreateWalletTransactionDto
): Promise<WalletTransaction> {
  try {
    // Validate walletId existence
    const wallet = await prisma.wallet.findUnique({
      where: { walletId: data.walletId },
    });
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // Validate orderId existence if provided
    if (data.orderId) {
      const order = await prisma.order.findUnique({
        where: { orderId: data.orderId },
      });
      if (!order) {
        throw new Error("Order not found");
      }
    }

    const transaction = await prisma.walletTransaction.create({
      data: {
        amount: data.amount,
        transactionType: data.transactionType,
        transactionStatus: data.transactionStatus,
        description: data.description,
        walletId: data.walletId,
        orderId: data.orderId,
      },
    });
    return transaction;
  } catch (error) {
    throw new Error(
      `Failed to create wallet transaction: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Retrieve all wallet transactions
 * @returns An array of all wallet transactions
 * @throws Error if the query fails
 */
export async function getAllWalletTransactions(): Promise<WalletTransaction[]> {
  try {
    const transactions = await prisma.walletTransaction.findMany();
    return transactions;
  } catch (error) {
    throw new Error(
      `Failed to fetch wallet transactions: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Retrieve a wallet transaction by its ID
 * @param transactionId - The ID of the wallet transaction
 * @returns The wallet transaction if found, or null if not found
 * @throws Error if the query fails
 */
export async function getWalletTransactionById(
  transactionId: BigInt
): Promise<WalletTransaction | null> {
  try {
    const transaction = await prisma.walletTransaction.findUnique({
      where: { transactionId: Number(transactionId) },
    });
    return transaction;
  } catch (error) {
    throw new Error(
      `Failed to fetch wallet transaction: ${getErrorMessage(error)}`
    );
  }
}
/**
 * Retrieve a wallet transaction by its ID
 * @param userId @param paginationParams @param filterParams
 * @returns The wallet transaction
 * @throws Error if the query fails
 */
export async function getCustomerWalletTransactions({
  userId,
  paginationParams,
  filterParams,
}: {
  userId: bigint;
  paginationParams: { page: number; limit: number; skip: number; sort: string };
  filterParams: { transactionStatus?: string; transactionType?: string };
}): Promise<any> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { userId },
      include: { wallet: true },
    });
    if (!customer) {
      throw new Error("Customer not found");
    }

    const { page, limit, skip, sort } = paginationParams;
    const { transactionStatus, transactionType } = filterParams;

    const whereClause: any = {
      walletId: customer.wallet?.walletId,
    };
    if (transactionStatus) whereClause.transactionStatus = transactionStatus;
    if (transactionType) whereClause.transactionType = transactionType;

    const transactions = await prisma.walletTransaction.findMany({
      where: whereClause,
      take: limit,
      skip: skip,
      orderBy: {
        createdAt: sort === "asc" ? "asc" : "desc",
      },
    });
    if (!transactions) {
      throw new Error("Wallet transactions not found");
    }
    const totalTransactions = await prisma.walletTransaction.count({
      where: whereClause,
    });

    return {
      transactions,
      currentPage: page,
      totalPages: Math.ceil(totalTransactions / limit),
      totalCount: totalTransactions,
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch wallet transaction: ${getErrorMessage(error)}`
    );
  }
}
/**
 * Update a wallet transaction by its ID
 * @param transactionId - The ID of the wallet transaction to update
 * @param data - Data to update the wallet transaction
 * @returns The updated wallet transaction
 * @throws Error if the transaction is not found or update fails
 */
export async function updateWalletTransaction(
  transactionId: BigInt,
  data: UpdateWalletTransactionDto
): Promise<WalletTransaction> {
  try {
    // Validate walletId existence if provided
    if (data.walletId) {
      const wallet = await prisma.wallet.findUnique({
        where: { walletId: data.walletId },
      });
      if (!wallet) {
        throw new Error("Wallet not found");
      }
    }

    // Validate orderId existence if provided
    if (data.orderId) {
      const order = await prisma.order.findUnique({
        where: { orderId: data.orderId },
      });
      if (!order) {
        throw new Error("Order not found");
      }
    }

    const transaction = await prisma.walletTransaction.update({
      where: { transactionId: Number(transactionId) },
      data: {
        amount: data.amount,
        transactionType: data.transactionType,
        transactionStatus: data.transactionStatus,
        description: data.description,
        walletId: data.walletId,
        orderId: data.orderId,
      },
    });
    return transaction;
  } catch (error) {
    throw new Error(
      `Failed to update wallet transaction: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Delete a wallet transaction by its ID
 * @param transactionId - The ID of the wallet transaction to delete
 * @throws Error if the transaction is not found or deletion fails
 */
export async function deleteWalletTransaction(
  transactionId: BigInt
): Promise<void> {
  try {
    await prisma.walletTransaction.delete({
      where: { transactionId: Number(transactionId) },
    });
  } catch (error) {
    throw new Error(
      `Failed to delete wallet transaction: ${getErrorMessage(error)}`
    );
  }
}
