/**
 * Routes for Payment entity operations.
 * Defines API endpoints for payment-related CRUD operations.
 */

import { Router } from "express";
import * as PaymentController from "@/modules/payments/payment.controller";

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

// SSLCommerz callback routes
router.post("/sslcommerz/success", PaymentController.handleSSLCommerzSuccess);
router.post("/sslcommerz/fail", PaymentController.handleSSLCommerzFailure);
router.post("/sslcommerz/cancel", PaymentController.handleSSLCommerzCancel);
router.post("/sslcommerz/ipn", PaymentController.handleSSLCommerzIPN);

export default router;
