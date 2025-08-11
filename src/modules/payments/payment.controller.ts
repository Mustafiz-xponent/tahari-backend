/**
 * Controller layer for Payment entity operations.
 * Handles HTTP requests and responses for payment-related endpoints.
 */

import { Request, Response } from "express";
import * as paymentService from "@/modules/payments/payment.service";
import {
  zCreatePaymentDto,
  zUpdatePaymentDto,
} from "@/modules/payments/payment.dto";
import { handleErrorResponse } from "@/utils/errorResponseHandler";
import { z } from "zod";
import httpStatus from "http-status";
import sendResponse from "@/utils/sendResponse";
import { Payment } from "@/generated/prisma/client";

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

    sendResponse<paymentService.PaymentResult>(res, {
      success: true,
      statusCode: httpStatus.CREATED,
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
    const tranId = req.body.tran_id;
    const paymentStatus = await paymentService.getOrderPaymentStatus(tranId);

    if (paymentStatus.paymentStatus === "COMPLETED") {
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
export const handleSSLCommerzFailure = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await paymentService.handleSSLCommerzFailure(req.body);
    res.redirect(`${process.env.PAYMENT_FAIL_DEEP_LINK}`);
  } catch (error) {
    res.redirect(`${process.env.PAYMENT_FAIL_DEEP_LINK}`);
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
    res.redirect(`${process.env.PAYMENT_CANCEL_DEEP_LINK}`);
  } catch (error) {
    res.redirect(`${process.env.PAYMENT_FAIL_DEEP_LINK}`);
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
    await paymentService.handleSSLCommerzSuccess(req.body);

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
 * Get all payments
 */
export const getAllPayments = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const payments = await paymentService.getAllPayments();

    sendResponse<Payment[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
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
    sendResponse<Payment>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Payment retrived successfully",
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
    const updatedPayment = await paymentService.updatePayment(paymentId, data);
    sendResponse<Payment>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Payment updated successfully",
      data: updatedPayment,
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

    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Payment deleted successfully",
      data: null,
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete payment");
  }
};
