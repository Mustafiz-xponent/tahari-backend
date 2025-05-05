/**
 * Controller layer for Wallet entity operations.
 * Handles HTTP requests and responses for wallet-related endpoints.
 */

import { Request, Response } from "express";
import * as walletService from "./wallet.service";
import { zCreateWalletDto, zUpdateWalletDto } from "./wallet.dto";
import { ZodError, z } from "zod";

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
    res.status(201).json({ message: "Wallet created successfully", wallet });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error creating wallet:", error);
    res.status(500).json({ message: "Failed to create wallet" });
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
    res.json(wallets);
  } catch (error) {
    console.error("Error fetching wallets:", error);
    res.status(500).json({ message: "Failed to fetch wallets" });
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
      res.status(404).json({ message: "Wallet not found" });
      return;
    }
    res.json(wallet);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error fetching wallet:", error);
    res.status(500).json({ message: "Failed to fetch wallet" });
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
    res.json({ message: "Wallet updated successfully", wallet: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error updating wallet:", error);
    res.status(500).json({ message: "Failed to update wallet" });
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
    res.json({ message: "Wallet deleted successfully" });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error deleting wallet:", error);
    res.status(500).json({ message: "Failed to delete wallet" });
  }
};
