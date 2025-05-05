/**
 * Controller layer for Payment entity operations.
 * Handles HTTP requests and responses for payment-related endpoints.
 */

import { Request, Response } from "express";
import * as paymentService from "./payment.service";
import { zCreatePaymentDto, zUpdatePaymentDto } from "./payment.dto";
import { ZodError, z } from "zod";

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
    res.status(201).json({ message: "Payment created successfully", payment });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error creating payment:", error);
    res.status(500).json({ message: "Failed to create payment" });
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
    res.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Failed to fetch payments" });
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
      res.status(404).json({ message: "Payment not found" });
      return;
    }
    res.json(payment);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error fetching payment:", error);
    res.status(500).json({ message: "Failed to fetch payment" });
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
    res.json({ message: "Payment updated successfully", payment: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error updating payment:", error);
    res.status(500).json({ message: "Failed to update payment" });
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
    res.json({ message: "Payment deleted successfully" });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error deleting payment:", error);
    res.status(500).json({ message: "Failed to delete payment" });
  }
};
