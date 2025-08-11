// src/modules/stock_transactions/stock_transaction.controller.ts

/**
 * Controller layer for StockTransaction entity operations.
 * Handles HTTP requests and responses for stock transaction-related endpoints.
 */

import { Request, Response } from "express";
import { z } from "zod";
import { handleErrorResponse } from "@/utils/errorResponseHandler";
import {
  zCreateStockTransactionArrayDto,
  zUpdateStockTransactionDto,
} from "@/modules/stock_transactions/stock_transaction.dto";
import * as stockTransactionService from "@/modules/stock_transactions/stock_transaction.service";
import httpStatus from "http-status";
import sendResponse from "@/utils/sendResponse";
import { StockTransaction } from "@/generated/prisma/client";
const transactionIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Transaction ID must be a positive integer",
});

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

    sendResponse<StockTransaction[]>(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: `${transactions.length} stock transaction${
        transactions.length > 1 ? "s" : ""
      } created successfully`,
      data: transactions,
      meta: { count: transactions.length },
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

    sendResponse<StockTransaction[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Stock transactions retrieved successfully",
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

    sendResponse<StockTransaction>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Stock transaction retrieved successfully",
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
    sendResponse<StockTransaction>(res, {
      success: true,
      statusCode: httpStatus.OK,
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

    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Stock transaction deleted successfully",
      data: null,
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete stock transaction");
  }
};
