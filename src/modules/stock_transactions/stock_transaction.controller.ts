// src/modules/stock_transactions/stock_transaction.controller.ts
/**
 * Controller layer for StockTransaction entity operations.
 * Handles HTTP requests and responses for stock transaction-related endpoints.
 */

import { Request, Response } from "express";
import * as stockTransactionService from "./stock_transaction.service";
import { zCreateStockTransactionDto, zUpdateStockTransactionDto } from "./stock_transaction.dto";
import { ZodError, z } from "zod";

const transactionIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Transaction ID must be a positive integer",
});

/**
 * Create a new stock transaction
 */
export const createStockTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCreateStockTransactionDto.parse(req.body);
    const transaction = await stockTransactionService.createStockTransaction(data);
    res.status(201).json({ message: "Stock transaction created successfully", transaction });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error creating stock transaction:", error);
    res.status(500).json({ message: "Failed to create stock transaction" });
  }
};

/**
 * Get all stock transactions
 */
export const getAllStockTransactions = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const transactions = await stockTransactionService.getAllStockTransactions();
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching stock transactions:", error);
    res.status(500).json({ message: "Failed to fetch stock transactions" });
  }
};

/**
 * Get a single stock transaction by ID
 */
export const getStockTransactionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const transactionId = transactionIdSchema.parse(req.params.id);
    const transaction = await stockTransactionService.getStockTransactionById(transactionId);
    if (!transaction) {
      res.status(404).json({ message: "Stock transaction not found" });
      return;
    }
    res.json(transaction);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error fetching stock transaction:", error);
    res.status(500).json({ message: "Failed to fetch stock transaction" });
  }
};

/**
 * Update a stock transaction by ID
 */
export const updateStockTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const transactionId = transactionIdSchema.parse(req.params.id);
    const data = zUpdateStockTransactionDto.parse(req.body);
    const updated = await stockTransactionService.updateStockTransaction(transactionId, data);
    res.json({ message: "Stock transaction updated successfully", transaction: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error updating stock transaction:", error);
    res.status(500).json({ message: "Failed to update stock transaction" });
  }
};

/**
 * Delete a stock transaction by ID
 */
export const deleteStockTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const transactionId = transactionIdSchema.parse(req.params.id);
    await stockTransactionService.deleteStockTransaction(transactionId);
    res.json({ message: "Stock transaction deleted successfully" });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error deleting stock transaction:", error);
    res.status(500).json({ message: "Failed to delete stock transaction" });
  }
};