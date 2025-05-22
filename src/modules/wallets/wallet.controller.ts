/**
 * Controller layer for Wallet entity operations.
 * Handles HTTP requests and responses for wallet-related endpoints.
 */

import { Request, Response } from "express";
import * as walletService from "./wallet.service";
import { zCreateWalletDto, zUpdateWalletDto } from "./wallet.dto";
import { handleErrorResponse } from "../../utils/errorResponseHandler";
import { z } from "zod";

const walletIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Wallet ID must be a positive integer",
});

/**
 * Create a new wallet
 */
export const createWallet = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCreateWalletDto.parse(req.body);
    const wallet = await walletService.createWallet(data);
    res.status(201).json({
      success: true,
      message: "Wallet created successfully",
      data: wallet,
    });
  } catch (error) {
    handleErrorResponse(error, res, "create wallet");
  }
};

/**
 * Get all wallets
 */
export const getAllWallets = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const wallets = await walletService.getAllWallets();
    res.json({
      success: true,
      message: "Wallets fetched successfully",
      data: wallets,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch wallets");
  }
};

/**
 * Get a single wallet by ID
 */
export const getWalletById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const walletId = walletIdSchema.parse(req.params.id);
    const wallet = await walletService.getWalletById(walletId);
    if (!wallet) {
      throw new Error("Wallet not found");
    }
    res.json({
      success: true,
      message: "Wallet fetched successfully",
      data: wallet,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch wallet");
  }
};

/**
 * Update a wallet by ID
 */
export const updateWallet = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const walletId = walletIdSchema.parse(req.params.id);
    const data = zUpdateWalletDto.parse(req.body);
    const updated = await walletService.updateWallet(walletId, data);
    res.json({
      success: true,
      message: "Wallet updated successfully",
      data: updated,
    });
  } catch (error) {
    handleErrorResponse(error, res, "update wallet");
  }
};

/**
 * Delete a wallet by ID
 */
export const deleteWallet = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const walletId = walletIdSchema.parse(req.params.id);
    await walletService.deleteWallet(walletId);
    res.json({
      success: true,
      message: "Wallet deleted successfully",
      data: null,
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete wallet");
  }
};
