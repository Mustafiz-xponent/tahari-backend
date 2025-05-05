/**
 * Controller layer for WalletTransaction entity operations.
 * Handles HTTP requests and responses for wallet transaction-related endpoints.
 */

import { Request, Response } from "express";
import * as walletTransactionService from "./wallet_transaction.service";
import {
  zCreateWalletTransactionDto,
  zUpdateWalletTransactionDto,
} from "./wallet_transaction.dto";
import { ZodError, z } from "zod";

const transactionIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Transaction ID must be a positive integer",
});

/**
 * Create a new wallet transaction
 */
export const createWalletTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCreateWalletTransactionDto.parse(req.body);
    const transaction = await walletTransactionService.createWalletTransaction(
      data
    );
    res
      .status(201)
      .json({
        message: "Wallet transaction created successfully",
        transaction,
      });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error creating wallet transaction:", error);
    res.status(500).json({ message: "Failed to create wallet transaction" });
  }
};

/**
 * Get all wallet transactions
 */
export const getAllWalletTransactions = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const transactions =
      await walletTransactionService.getAllWalletTransactions();
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    res.status(500).json({ message: "Failed to fetch wallet transactions" });
  }
};

/**
 * Get a single wallet transaction by ID
 */
export const getWalletTransactionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const transactionId = transactionIdSchema.parse(req.params.id);
    const transaction = await walletTransactionService.getWalletTransactionById(
      transactionId
    );
    if (!transaction) {
      res.status(404).json({ message: "Wallet transaction not found" });
      return;
    }
    res.json(transaction);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error fetching wallet transaction:", error);
    res.status(500).json({ message: "Failed to fetch wallet transaction" });
  }
};

/**
 * Update a wallet transaction by ID
 */
export const updateWalletTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const transactionId = transactionIdSchema.parse(req.params.id);
    const data = zUpdateWalletTransactionDto.parse(req.body);
    const updated = await walletTransactionService.updateWalletTransaction(
      transactionId,
      data
    );
    res.json({
      message: "Wallet transaction updated successfully",
      transaction: updated,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error updating wallet transaction:", error);
    res.status(500).json({ message: "Failed to update wallet transaction" });
  }
};

/**
 * Delete a wallet transaction by ID
 */
export const deleteWalletTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const transactionId = transactionIdSchema.parse(req.params.id);
    await walletTransactionService.deleteWalletTransaction(transactionId);
    res.json({ message: "Wallet transaction deleted successfully" });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error deleting wallet transaction:", error);
    res.status(500).json({ message: "Failed to delete wallet transaction" });
  }
};
