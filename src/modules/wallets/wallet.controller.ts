import { Request, Response } from "express";
import * as walletService from "@/modules/wallets/wallet.service";
import {
  zCreateWalletDto,
  zUpdateWalletDto,
} from "@/modules/wallets/wallet.dto";
import { handleErrorResponse } from "@/utils/errorResponseHandler";
import { z } from "zod";
import httpStatus from "http-status";
import sendResponse from "@/utils/sendResponse";
import { Wallet } from "@/generated/prisma/client";
import { WalletDepositeResult } from "@/modules/wallets/wallet.interface";

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

    sendResponse<Wallet>(res, {
      success: true,
      statusCode: httpStatus.CREATED,
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
    const userId = req.user?.userId;

    // Validation
    if (!amount || amount <= 0) {
      sendResponse<null>(res, {
        success: false,
        statusCode: httpStatus.BAD_REQUEST,
        message: "Valid amount are required",
        data: null,
      });
      return;
    }

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
    const tranId = req.body.tran_id;
    const paymentStatus = await walletService.getPaymentStatus(tranId);

    if (paymentStatus === "COMPLETED") {
      res.redirect(`${process.env.PAYMENT_SUCCESS_DEEP_LINK}`);
    } else {
      res.redirect(`${process.env.PAYMENT_FAIL_DEEP_LINK}`);
    }
  } catch (error) {
    res.redirect(`${process.env.PAYMENT_FAIL_DEEP_LINK}`);
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
    await walletService.handleDepositeFailure(req.body);
    res.redirect(`${process.env.PAYMENT_FAIL_DEEP_LINK}`);
  } catch (error) {
    res.redirect(`${process.env.PAYMENT_FAIL_DEEP_LINK}`);
  }
};
/**
/**
 * Handle SSLCommerz cancel callback
 */
export const handleSslCommerzCancel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await walletService.handleDepositeFailure(req.body);
    res.redirect(`${process.env.PAYMENT_CANCEL_DEEP_LINK}`);
  } catch (error) {
    res.redirect(`${process.env.PAYMENT_FAIL_DEEP_LINK}`);
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
    await walletService.handleDepositeSuccess(req.body);
    res
      .status(httpStatus.OK)
      .json({ success: true, message: "IPN received successfully" });
  } catch (error) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "IPN failed" });
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

    sendResponse<Wallet[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Wallets retrived successfully",
      data: wallets,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch wallets");
  }
};

/**
 * Get a customer wallet balance
 */
export const getCustomerWalletBalanace = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
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
  } catch (error) {
    handleErrorResponse(error, res, "fetch wallet");
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

    sendResponse<Wallet>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Wallet retrived successfully",
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
    const updatedWallet = await walletService.updateWallet(walletId, data);

    sendResponse<Wallet>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Wallet updated successfully",
      data: updatedWallet,
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
    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Wallet deleted successfully",
      data: null,
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete wallet");
  }
};
