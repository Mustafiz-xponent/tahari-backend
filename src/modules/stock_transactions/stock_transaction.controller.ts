// src/modules/stock_transactions/stock_transaction.controller.ts

/**
 * Controller layer for StockTransaction entity operations.
 * Handles HTTP requests and responses for stock transaction-related endpoints.
 */

import { Request, Response } from "express";
import { z } from "zod";
import { handleErrorResponse } from "../../utils/errorResponseHandler";
import {
  zCreateStockTransactionArrayDto,
  zCreateStockTransactionDto,
  zUpdateStockTransactionDto,
} from "./stock_transaction.dto";
import * as stockTransactionService from "./stock_transaction.service";

const transactionIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Transaction ID must be a positive integer",
});

// /**
//  * Create a new stock transaction
//  */
// export const createStockTransaction = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const data = zCreateStockTransactionDto.parse(req.body);
//     const transaction = await stockTransactionService.createStockTransaction(
//       data
//     );
//     res.status(201).json({
//       success: true,
//       message: "Stock transaction created successfully",
//       data: transaction,
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "create stock transaction");
//   }
// };

/**
 * Create stock transaction(s) - always processes array of transactions
 */
export const createStockTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCreateStockTransactionArrayDto.parse(req.body);
    const transactions = await stockTransactionService.createStockTransaction(
      data
    );

    res.status(201).json({
      success: true,
      message: `${transactions.length} stock transaction${
        transactions.length > 1 ? "s" : ""
      } created successfully`,
      data: transactions,
      count: transactions.length,
    });
  } catch (error) {
    handleErrorResponse(error, res, "create stock transaction");
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
    const transactions =
      await stockTransactionService.getAllStockTransactions();
    res.json({
      success: true,
      message: "Stock transactions fetched successfully",
      data: transactions,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch stock transactions");
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
    const transaction = await stockTransactionService.getStockTransactionById(
      transactionId
    );
    if (!transaction) {
      throw new Error("Stock transaction not found");
    }
    res.json({
      success: true,
      message: "Stock transaction fetched successfully",
      data: transaction,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch stock transaction");
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
    const updated = await stockTransactionService.updateStockTransaction(
      transactionId,
      data
    );
    res.json({
      success: true,
      message: "Stock transaction updated successfully",
      data: updated,
    });
  } catch (error) {
    handleErrorResponse(error, res, "update stock transaction");
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
    res.json({
      success: true,
      message: "Stock transaction deleted successfully",
      data: null,
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete stock transaction");
  }
};
