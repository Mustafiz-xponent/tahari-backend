/**
 * Controller layer for FarmerTransaction entity operations.
 * Handles HTTP requests and responses for farmer transaction-related endpoints.
 */
import { Request, Response } from "express";
import * as farmerTransactionService from "@/modules/farmer_transactions/farmer_transactions.service";
import {
  zCreateFarmerTransactionDto,
  zUpdateFarmerTransactionDto,
} from "@/modules/farmer_transactions/farmer_transactions.dto";

import { handleErrorResponse } from "@/utils/errorResponseHandler";
import { z } from "zod";

const transactionIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Transaction ID must be a positive integer",
});
const purchaseIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Transaction ID must be a positive integer",
});
const farmerIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Transaction ID must be a positive integer",
});

/**
 * Create a new farmer transaction
 */
export const createFarmerTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCreateFarmerTransactionDto.parse(req.body);
    const transaction = await farmerTransactionService.createFarmerTransaction(
      data
    );
    res.status(201).json({
      success: true,
      message: "Farmer transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    handleErrorResponse(error, res, "create farmer transaction");
  }
};

/**
 * Get all farmer transactions
 */
export const getAllFarmerTransactions = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const transactions =
      await farmerTransactionService.getAllFarmerTransactions();
    res.json({
      success: true,
      message: "Farmer transactions retrieved successfully",
      data: transactions,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch farmer transactions");
  }
};

/**
 * Get a single farmer transaction by ID
 */
export const getFarmerTransactionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const transactionId = transactionIdSchema.parse(req.params.id);
    const transaction = await farmerTransactionService.getFarmerTransactionById(
      transactionId
    );
    if (!transaction) {
      res.status(404).json({
        success: false,
        message: "Farmer transaction not found",
      });
      return;
    }
    res.json({
      success: true,
      message: "Farmer transaction retrieved successfully",
      data: transaction,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch farmer transaction");
  }
};

/**
 * Update a farmer transaction by ID
 */
export const updateFarmerTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const transactionId = transactionIdSchema.parse(req.params.id);
    const data = zUpdateFarmerTransactionDto.parse(req.body);
    const updated = await farmerTransactionService.updateFarmerTransaction(
      transactionId,
      data
    );
    res.json({
      success: true,
      message: "Farmer transaction updated successfully",
      data: updated,
    });
  } catch (error) {
    handleErrorResponse(error, res, "update farmer transaction");
  }
};

/**
 * Delete a farmer transaction by ID
 */
export const deleteFarmerTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const transactionId = transactionIdSchema.parse(req.params.id);
    await farmerTransactionService.deleteFarmerTransaction(transactionId);
    res.json({
      success: true,
      message: "Farmer transaction deleted successfully",
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete farmer transaction");
  }
};

/**
 * Get all transactions by a specific farmer
 */
export const getTransactionsByFarmer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const farmerId = farmerIdSchema.parse(req.params.farmerId);
    const transactions =
      await farmerTransactionService.getTransactionsByFarmerId(farmerId);
    res.json({
      success: true,
      message: "Farmer transactions retrieved successfully",
      data: transactions,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch farmer transactions by farmer");
  }
};

/**
 * Get all transactions for a specific purchase
 */
export const getTransactionsByPurchase = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const purchaseId = purchaseIdSchema.parse(req.params.purchaseId);
    const transactions =
      await farmerTransactionService.getTransactionsByPurchaseId(purchaseId);
    res.json({
      success: true,
      message: "Farmer transactions retrieved successfully",
      data: transactions,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch farmer transactions by purchase");
  }
};
