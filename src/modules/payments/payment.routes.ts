/**
 * Routes for Payment entity operations.
 * Defines API endpoints for payment-related CRUD operations.
 */

import { Router } from "express";
import * as PaymentController from "./payments.controller";

const router = Router();

// Route to create a new payment
router.post("/", PaymentController.createPayment);

// Route to get all payments
router.get("/", PaymentController.getAllPayments);

// Route to get a payment by ID
router.get("/:id", PaymentController.getPaymentById);

// Route to update a payment's details
router.put("/:id", PaymentController.updatePayment);

// Route to delete a payment
router.delete("/:id", PaymentController.deletePayment);

export default router;
