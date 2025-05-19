/**
 * Service layer for FarmerTransaction entity operations.
 * Contains business logic and database interactions for farmer transactions.
 */

import prisma from "../../prisma-client/prismaClient";
import { FarmerTransaction } from "../../../generated/prisma/client";
import {
  CreateFarmerTransactionDto,
  UpdateFarmerTransactionDto,
} from "./farmer_transactions.dto";
import { getErrorMessage } from "../../utils/errorHandler";

/**
 * Create a new farmer transaction
 * @param data - Data required to create a farmer transaction
 * @returns The created farmer transaction
 * @throws Error if the farmer transaction cannot be created (e.g., invalid foreign keys)
 */
export async function createFarmerTransaction(
  data: CreateFarmerTransactionDto
): Promise<FarmerTransaction> {
  try {
    // Calculate the balance automatically
    const balance = data.amountDue - data.amountPaid;

    const farmerTransaction = await prisma.farmerTransaction.create({
      data: {
        amountDue: data.amountDue,
        amountPaid: data.amountPaid,
        balance: balance,
        paymentStatus: data.paymentStatus,
        farmerId: data.farmerId,
        purchaseId: data.purchaseId,
      },
      include: {
        farmer: true,
        inventoryPurchase: {
          include: {
            product: true,
          },
        },
      },
    });
    return farmerTransaction;
  } catch (error) {
    throw new Error(
      `Failed to create farmer transaction: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Retrieve all farmer transactions
 * @returns An array of all farmer transactions
 * @throws Error if the query fails
 */
export async function getAllFarmerTransactions(): Promise<FarmerTransaction[]> {
  try {
    const farmerTransactions = await prisma.farmerTransaction.findMany({
      include: {
        farmer: true,
        inventoryPurchase: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return farmerTransactions;
  } catch (error) {
    throw new Error(
      `Failed to fetch farmer transactions: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Retrieve a farmer transaction by its ID
 * @param transactionId - The ID of the farmer transaction
 * @returns The farmer transaction if found, or null if not found
 * @throws Error if the query fails
 */
export async function getFarmerTransactionById(
  transactionId: bigint
): Promise<FarmerTransaction | null> {
  try {
    const farmerTransaction = await prisma.farmerTransaction.findUnique({
      where: { transactionId },
      include: {
        farmer: true,
        inventoryPurchase: {
          include: {
            product: true,
          },
        },
        farmerPayments: true,
      },
    });
    return farmerTransaction;
  } catch (error) {
    throw new Error(
      `Failed to fetch farmer transaction: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Update a farmer transaction by its ID
 * @param transactionId - The ID of the farmer transaction to update
 * @param data - Data to update the farmer transaction
 * @returns The updated farmer transaction
 * @throws Error if the farmer transaction is not found or update fails
 */
export async function updateFarmerTransaction(
  transactionId: bigint,
  data: UpdateFarmerTransactionDto
): Promise<FarmerTransaction> {
  try {
    // Fetch the existing transaction to calculate the new balance
    const existing = await prisma.farmerTransaction.findUnique({
      where: { transactionId },
    });

    if (!existing) {
      throw new Error("Farmer transaction not found");
    }

    // Calculate the new balance if amount paid is updated
    const amountPaid = data.amountPaid ?? existing.amountPaid;
    // Ensure both values are treated as numbers
    const balance = Number(existing.amountDue) - Number(amountPaid);

    const farmerTransaction = await prisma.farmerTransaction.update({
      where: { transactionId },
      data: {
        ...data,
        balance,
      },
      include: {
        farmer: true,
        inventoryPurchase: {
          include: {
            product: true,
          },
        },
      },
    });
    return farmerTransaction;
  } catch (error) {
    throw new Error(
      `Failed to update farmer transaction: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Delete a farmer transaction by its ID
 * @param transactionId - The ID of the farmer transaction to delete
 * @throws Error if the farmer transaction is not found or deletion fails
 */
export async function deleteFarmerTransaction(
  transactionId: bigint
): Promise<void> {
  try {
    await prisma.farmerTransaction.delete({
      where: { transactionId },
    });
  } catch (error) {
    throw new Error(
      `Failed to delete farmer transaction: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Retrieve all transactions for a specific farmer
 * @param farmerId - The ID of the farmer
 * @returns An array of farmer transactions for the specified farmer
 * @throws Error if the query fails
 */
export async function getTransactionsByFarmerId(
  farmerId: bigint
): Promise<FarmerTransaction[]> {
  try {
    const transactions = await prisma.farmerTransaction.findMany({
      where: { farmerId },
      include: {
        inventoryPurchase: {
          include: {
            product: true,
          },
        },
        farmerPayments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return transactions;
  } catch (error) {
    throw new Error(
      `Failed to fetch transactions by farmer ID: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Retrieve all transactions for a specific purchase
 * @param purchaseId - The ID of the inventory purchase
 * @returns An array of farmer transactions for the specified purchase
 * @throws Error if the query fails
 */
export async function getTransactionsByPurchaseId(
  purchaseId: bigint
): Promise<FarmerTransaction[]> {
  try {
    const transactions = await prisma.farmerTransaction.findMany({
      where: { purchaseId },
      include: {
        farmer: true,
        farmerPayments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return transactions;
  } catch (error) {
    throw new Error(
      `Failed to fetch transactions by purchase ID: ${getErrorMessage(error)}`
    );
  }
}
