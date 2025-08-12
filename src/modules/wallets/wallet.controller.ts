import { Request, Response } from "express";
import * as walletService from "@/modules/wallets/wallet.service";
import {
  DeleteWalletDto,
  GetWalletDto,
  UpdateWalletDto,
} from "@/modules/wallets/wallet.dto";
import httpStatus from "http-status";
import sendResponse from "@/utils/sendResponse";
import { Wallet } from "@/generated/prisma/client";
import { WalletDepositeResult } from "@/modules/wallets/wallet.interface";
import asyncHandler from "@/utils/asyncHandler";

/**
 * Create a new wallet
 */
export const createWallet = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const wallet = await walletService.createWallet(req.body);

    sendResponse<Wallet>(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Wallet created successfully",
      data: wallet,
    });
  }
);

/**
 * Initiate wallet deposit
 */
export const initiateWalletDeposit = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { amount } = req.body;
    const userId = req.user?.userId;

    const depositData = await walletService.initiateDeposit({
      userId: Number(userId!),
      amount: parseFloat(amount),
    });

    sendResponse<WalletDepositeResult>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Deposit initiated successfully",
      data: depositData,
    });
  }
);
/**
 * Handle SSLCommerz success callback
 */
export const handleSslCommerzSuccess = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const tranId = req.body.tran_id;
    const paymentStatus = await walletService.getPaymentStatus(tranId);

    if (paymentStatus === "COMPLETED") {
      res.redirect(`${process.env.PAYMENT_SUCCESS_DEEP_LINK}`);
    } else {
      res.redirect(`${process.env.PAYMENT_FAIL_DEEP_LINK}`);
    }
  }
);

/**
 * Handle SSLCommerz failure callback
 */
export const handleSslCommerzFailure = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await walletService.handleDepositeFailure(req.body);
    res.redirect(`${process.env.PAYMENT_FAIL_DEEP_LINK}`);
  }
);
/**
/**
 * Handle SSLCommerz cancel callback
 */
export const handleSslCommerzCancel = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await walletService.handleDepositeFailure(req.body);
    res.redirect(`${process.env.PAYMENT_CANCEL_DEEP_LINK}`);
  }
);

/**
 * Handle SSLCommerz IPN (Instant Payment Notification)
 */
export const handleSslCommerzIPN = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await walletService.handleDepositeSuccess(req.body);
    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "IPN received successfully",
      data: null,
    });
  } catch (error) {
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "IPN failed",
      data: null,
    });
  }
};
/**
 * Get all wallets
 */
export const getAllWallets = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const wallets = await walletService.getAllWallets();

    sendResponse<Wallet[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Wallets retrived successfully",
      data: wallets,
    });
  }
);

/**
 * Get a customer wallet balance
 */
export const getCustomerWalletBalanace = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const wallet = await walletService.getCustomerWalletBalanace(
      BigInt(req?.user?.userId!)
    );
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    sendResponse<Wallet>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Wallet retrived successfully",
      data: wallet,
    });
  }
);
/**
 * Get a single wallet by ID
 */
export const getWalletById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const walletId = req.params.id as unknown as GetWalletDto["params"]["id"];
    const wallet = await walletService.getWalletById(walletId);

    sendResponse<Wallet>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Wallet retrived successfully",
      data: wallet,
    });
  }
);

/**
 * Update a wallet by ID
 */
export const updateWallet = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const walletId = req.params
      .id as unknown as UpdateWalletDto["params"]["id"];
    const data = req.body;
    const updatedWallet = await walletService.updateWallet(walletId, data);

    sendResponse<Wallet>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Wallet updated successfully",
      data: updatedWallet,
    });
  }
);

/**
 * Delete a wallet by ID
 */
export const deleteWallet = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const walletId = req.params
      .id as unknown as DeleteWalletDto["params"]["id"];
    await walletService.deleteWallet(walletId);

    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Wallet deleted successfully",
      data: null,
    });
  }
);
