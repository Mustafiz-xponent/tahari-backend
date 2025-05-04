//  src/modules/farmer_payments/farmer_payment.controller.ts

/**
 * Controller layer for FarmerPayment entity operations.
 * Handles HTTP requests and responses for farmer payment-related endpoints.
 */

import { Request, Response } from "express";
import * as farmerPaymentService from "./farmer_payment.service";
import { zCreateFarmerPaymentDto, zUpdateFarmerPaymentDto } from "./farmer_payment.dto";
import { ZodError, z } from "zod";

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
    res.status(201).json({ message: "Farmer payment created successfully", payment });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error creating farmer payment:", error);
    res.status(500).json({ message: "Failed to create farmer payment" });
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
    res.json(payments);
  } catch (error) {
    console.error("Error fetching farmer payments:", error);
    res.status(500).json({ message: "Failed to fetch farmer payments" });
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
      res.status(404).json({ message: "Farmer payment not found" });
      return;
    }
    res.json(payment);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error fetching farmer payment:", error);
    res.status(500).json({ message: "Failed to fetch farmer payment" });
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
    const updated = await farmerPaymentService.updateFarmerPayment(paymentId, data);
    res.json({ message: "Farmer payment updated successfully", payment: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error updating farmer payment:", error);
    res.status(500).json({ message: "Failed to update farmer payment" });
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
    res.json({ message: "Farmer payment deleted successfully" });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error deleting farmer payment:", error);
    res.status(500).json({ message: "Failed to delete farmer payment" });
  }
};