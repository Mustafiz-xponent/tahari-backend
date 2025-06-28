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
 * Initiate wallet deposit
 */
export const initiateWalletDeposit = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { amount } = req.body;
    const userId = req?.user?.userId;

    // Validation
    if (!amount || amount <= 0) {
      res.status(400).json({
        success: false,
        message: "Valid amount are required",
      });
      return;
    }

    const depositData = await walletService.initiateDeposit({
      userId: BigInt(userId!),
      amount: parseFloat(amount),
    });

    res.json({
      success: true,
      message: "Deposit initiated successfully",
      data: depositData,
    });
  } catch (error) {
    handleErrorResponse(error, res, "initiate wallet deposit");
  }
};
/**
 * Handle SSLCommerz success callback
 */
export const handleSslCommerzSuccess = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("SUCCESS WEBHOOK CALLED");
    const result = await walletService.handleDepositeSuccess(req.body);

    if (result.success) {
      // res.redirect(`${process.env.PAYMENT_SUCCESS_DEEP_LINK}`);
      res.redirect("https://www.geeksforgeeks.org");
      console.log("PAYMENT COMPLETED");
    } else {
      // res.redirect(`${process.env.PAYMENT_FAIL_DEEP_LINK}`);
      res.redirect("https://www.geeksforgeeks.org");
      console.log("PAYMENT FAILED");
    }
  } catch (error) {
    console.log("SUCCESS ERROR:", error);
    // res.redirect(`${process.env.PAYMENT_FAIL_DEEP_LINK}`);
    res.redirect("https://www.geeksforgeeks.org");
    console.log("PAYMENT FAILED");
  }
};

/**
 * Handle SSLCommerz failure callback
 */
export const handleSslCommerzFailure = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("FAILURE WEBHOOK CALLED");
    await walletService.handleDepositeFailure(req.body);
    // res.redirect(`${process.env.PAYMENT_FAIL_DEEP_LINK}`);
    res.redirect("https://www.geeksforgeeks.org");
    console.log("PAYMENT FAILED");
  } catch (error) {
    // res.redirect(`${process.env.PAYMENT_FAIL_DEEP_LINK}`);
    res.redirect("https://www.geeksforgeeks.org");
    console.log("PAYMENT FAILED");
  }
};
/**
 * Handle SSLCommerz cancel callback
 */
export const handleSslCommerzCancel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("CANCEL WEBHOOK CALLED");
    await walletService.handleDepositeFailure(req.body);
    res.redirect(`${process.env.PAYMENT_CANCEL_DEEP_LINK}`);
    console.log("PAYMENT CANCELLED");
  } catch (error) {
    res.redirect(`${process.env.PAYMENT_FAIL_DEEP_LINK}`);
    console.log("PAYMENT CANCELLED");
  }
};

/**
 * Handle SSLCommerz IPN (Instant Payment Notification)
 */
export const handleSslCommerzIPN = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("IPN WEBHOOK CALLED");
    await walletService.handleDepositeSuccess(req.body);
    res.status(200).json({ message: "IPN received successfully" });
  } catch (error) {
    console.error("SSLCommerz IPN error:", error);
    res.status(200).json({ message: "IPN received successfully" });
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
