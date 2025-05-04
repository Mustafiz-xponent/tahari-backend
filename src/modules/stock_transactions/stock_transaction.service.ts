/**
 * Service layer for StockTransaction entity operations.
 * Contains business logic and database interactions for stock transactions.
 */

import prisma from "../../prisma-client/prismaClient";
import {
  StockTransaction,
  TransactionType,
} from "../../../generated/prisma/client";
import {
  CreateStockTransactionDto,
  UpdateStockTransactionDto,
} from "./stock_transaction.dto";
import { getErrorMessage } from "@/utils/errorHandler";

/**
 * Create a new stock transaction
 * @param data - Data required to create a stock transaction
 * @returns The created stock transaction
 * @throws Error if the stock transaction cannot be created (e.g., invalid foreign keys)
 */

export async function createStockTransaction(
  data: CreateStockTransactionDto
): Promise<StockTransaction> {
  try {
    const stockTransaction = await prisma.stockTransaction.create({
      data: {
        quantity: data.quantity,
        transactionType: data.transactionType,
        productId: data.productId,
        purchaseId: data.purchaseId,
        orderId: data.orderId,
        description: data.description,
      },
    });
    return stockTransaction;
  } catch (error) {
    throw new Error(
      `Failed to create stock transaction: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Retrieve all stock transactions
 * @returns An array of all stock transactions
 * @throws Error if the query fails
 */
export async function getAllStockTransactions(): Promise<StockTransaction[]> {
  try {
    const stockTransactions = await prisma.stockTransaction.findMany();
    return stockTransactions;
  } catch (error) {
    throw new Error(
      `Failed to fetch stock transactions: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Retrieve a stock transaction by its ID
 * @param transactionId - The ID of the stock transaction
 * @returns The stock transaction if found, or null if not found
 * @throws Error if the query fails
 */
export async function getStockTransactionById(
  transactionId: BigInt
): Promise<StockTransaction | null> {
  try {
    const stockTransaction = await prisma.stockTransaction.findUnique({
      where: { transactionId: Number(transactionId) },
    });
    return stockTransaction;
  } catch (error) {
    throw new Error(
      `Failed to fetch stock transaction: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Update a stock transaction by its ID
 * @param transactionId - The ID of the stock transaction to update
 * @param data - Data to update the stock transaction
 * @returns The updated stock transaction
 * @throws Error if the stock transaction is not found or update fails
 */
export async function updateStockTransaction(
  transactionId: BigInt,
  data: UpdateStockTransactionDto
): Promise<StockTransaction> {
  try {
    const stockTransaction = await prisma.stockTransaction.update({
      where: { transactionId: Number(transactionId) },
      data: {
        quantity: data.quantity,
        transactionType: data.transactionType,
        productId: data.productId,
        purchaseId: data.purchaseId,
        orderId: data.orderId,
        description: data.description,
      },
    });
    return stockTransaction;
  } catch (error) {
    throw new Error(
      `Failed to update stock transaction: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Delete a stock transaction by its ID
 * @param transactionId - The ID of the stock transaction to delete
 * @throws Error if the stock transaction is not found or deletion fails
 */
export async function deleteStockTransaction(
  transactionId: BigInt
): Promise<void> {
  try {
    await prisma.stockTransaction.delete({
      where: { transactionId: Number(transactionId) },
    });
  } catch (error) {
    throw new Error(
      `Failed to delete stock transaction: ${getErrorMessage(error)}`
    );
  }
}
