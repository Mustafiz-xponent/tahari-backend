// src/modules/farmer_payments/farmer_payment.controller.ts

/**
 * Controller layer for FarmerPayment entity operations.
 * Handles HTTP requests and responses for farmer payment-related endpoints.
 */

import { Request, Response } from "express";
import * as farmerPaymentService from "@/modules/farmer_payments/farmer_payment.service";
import {
  zCreateFarmerPaymentDto,
  zUpdateFarmerPaymentDto,
} from "@/modules/farmer_payments/farmer_payment.dto";
import { z } from "zod";
import { handleErrorResponse } from "@/utils/errorResponseHandler";
import httpStatus from "http-status";
import sendResponse from "@/utils/sendResponse";
import { FarmerPayment } from "@/generated/prisma/client";

const paymentIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Payment ID must be a positive integer",
});

/**
 * Create a new farmer payment
 */
export const createFarmerPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCreateFarmerPaymentDto.parse(req.body);
    const payment = await farmerPaymentService.createFarmerPayment(data);
    sendResponse<FarmerPayment>(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Farmer payment created successfully",
      data: payment,
    });
  } catch (error) {
    handleErrorResponse(error, res, "create farmer payment");
  }
};

/**
 * Get all farmer payments
 */
export const getAllFarmerPayments = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const payments = await farmerPaymentService.getAllFarmerPayments();
    sendResponse<FarmerPayment[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Farmer payments retrieved successfully",
      data: payments,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch farmer payments");
  }
};

/**
 * Get a single farmer payment by ID
 */
export const getFarmerPaymentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const paymentId = paymentIdSchema.parse(req.params.id);
    const payment = await farmerPaymentService.getFarmerPaymentById(paymentId);
    if (!payment) {
      throw new Error("Farmer payment not found");
    }
    sendResponse<FarmerPayment>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Farmer payment retrieved successfully",
      data: payment,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch farmer payment");
  }
};

/**
 * Update a farmer payment by ID
 */
export const updateFarmerPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const paymentId = paymentIdSchema.parse(req.params.id);
    const data = zUpdateFarmerPaymentDto.parse(req.body);
    const updated = await farmerPaymentService.updateFarmerPayment(
      paymentId,
      data
    );
    sendResponse<FarmerPayment>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Farmer payment updated successfully",
      data: updated,
    });
  } catch (error) {
    handleErrorResponse(error, res, "update farmer payment");
  }
};

/**
 * Delete a farmer payment by ID
 */
export const deleteFarmerPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const paymentId = paymentIdSchema.parse(req.params.id);
    await farmerPaymentService.deleteFarmerPayment(paymentId);
    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Farmer payment deleted successfully",
      data: null,
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete farmer payment");
  }
};
