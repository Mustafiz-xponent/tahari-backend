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
import { handleErrorResponse } from "../../utils/errorResponseHandler";
import { z } from "zod";

const transactionIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Transaction ID must be a positive integer",
});
interface ICustomerTransactionQuery {
  page?: string;
  limit?: string;
  sort?: "asc" | "desc";
  transactionStatus?: string;
  transactionType?: string;
}
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
    res.status(201).json({
      success: true,
      message: "Wallet transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    handleErrorResponse(error, res, "create wallet transaction");
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
    res.json({
      success: true,
      message: "Wallet transactions fetched successfully",
      data: transactions,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch wallet transactions");
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
      throw new Error("Wallet transaction not found");
    }
    res.json({
      success: true,
      message: "Wallet transaction fetched successfully",
      data: transaction,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch wallet transaction");
  }
};
/**
 * Get a customer wallet transactions
 */
export const getCustomerWalletTransactions = async (
  req: Request<{}, {}, {}, ICustomerTransactionQuery>,
  res: Response
): Promise<void> => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit as string) || 10, 1),
      100
    ); // Max 100 items per page
    const skip = (page - 1) * limit;
    const sort = req.query.sort === "asc" ? "asc" : "desc";
    const transactionStatus = req.query.transactionStatus?.toUpperCase();
    const transactionType = req.query.transactionType?.toUpperCase();
    const paginationParams = { page, limit, skip, sort };
    const filterParams = { transactionStatus, transactionType };
    if (!req.user?.userId) throw new Error("Please login to continue");
    const userId = BigInt(req?.user?.userId!);

    const result = await walletTransactionService.getCustomerWalletTransactions(
      {
        userId,
        paginationParams,
        filterParams,
      }
    );

    res.json({
      success: true,
      message: "Wallet transactions fetched successfully",
      data: result.transactions,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalCount,
        itemsPerPage: limit,
        hasNextPage: page < result.totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch wallet transaction");
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
      success: true,
      message: "Wallet transaction updated successfully",
      data: updated,
    });
  } catch (error) {
    handleErrorResponse(error, res, "update wallet transaction");
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
    res.json({
      success: true,
      message: "Wallet transaction deleted successfully",
      data: null,
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete wallet transaction");
  }
};
