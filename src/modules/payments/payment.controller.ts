/**
 * Controller layer for Payment entity operations.
 * Handles HTTP requests and responses for payment-related endpoints.
 */

import { Request, Response } from "express";
import * as paymentService from "./payment.service";
import { zCreatePaymentDto, zUpdatePaymentDto } from "./payment.dto";
import { handleErrorResponse } from "../../utils/errorResponseHandler";
import { z } from "zod";

const paymentIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Payment ID must be a positive integer",
});

/**
 * Create a new payment
 */
export const createPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCreatePaymentDto.parse(req.body);
    const payment = await paymentService.createPayment(data);
    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: payment,
    });
  } catch (error) {
    handleErrorResponse(error, res, "create payment");
  }
};
/**
 * Handle SSLCommerz success callback
 */
export const handleSSLCommerzSuccess = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await paymentService.handleSSLCommerzSuccess(req.body);

    if (result.success) {
      res.redirect(`${process.env.FRONTEND_URL}/payment/success`);
    } else {
      res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
    }
  } catch (error) {
    console.error("SSLCommerz success callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
  }
};

/**
 * Handle SSLCommerz failure callback
 */
export const handleSSLCommerzFailure = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await paymentService.handleSSLCommerzFailure(req.body);
    res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
  } catch (error) {
    console.error("SSLCommerz failure callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
  }
};
/**
 * Handle SSLCommerz cancel callback
 */
export const handleSSLCommerzCancel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await paymentService.handleSSLCommerzFailure(req.body);
    res.redirect(`${process.env.FRONTEND_URL}/payment/cancelled`);
  } catch (error) {
    console.error("SSLCommerz cancel callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
  }
};

/**
 * Handle SSLCommerz IPN (Instant Payment Notification)
 */
export const handleSSLCommerzIPN = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await paymentService.handleSSLCommerzSuccess(req.body);
    res.status(200).send("OK");
  } catch (error) {
    console.error("SSLCommerz IPN error:", error);
    res.status(500).send("ERROR");
  }
};

/**
 * Get all payments
 */
export const getAllPayments = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const payments = await paymentService.getAllPayments();
    res.json({
      success: true,
      message: "Payments fetched successfully",
      data: payments,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch payments");
  }
};

/**
 * Get a single payment by ID
 */
export const getPaymentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const paymentId = paymentIdSchema.parse(req.params.id);
    const payment = await paymentService.getPaymentById(paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }
    res.json({
      success: true,
      message: "Payment fetched successfully",
      data: payment,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch payment");
  }
};

/**
 * Update a payment by ID
 */
export const updatePayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const paymentId = paymentIdSchema.parse(req.params.id);
    const data = zUpdatePaymentDto.parse(req.body);
    const updated = await paymentService.updatePayment(paymentId, data);
    res.json({
      success: true,
      message: "Payment updated successfully",
      data: updated,
    });
  } catch (error) {
    handleErrorResponse(error, res, "update payment");
  }
};

/**
 * Delete a payment by ID
 */
export const deletePayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const paymentId = paymentIdSchema.parse(req.params.id);
    await paymentService.deletePayment(paymentId);
    res.json({
      success: true,
      message: "Payment deleted successfully",
      data: null,
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete payment");
  }
};
