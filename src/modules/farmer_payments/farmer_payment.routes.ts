/**
 * Routes for FarmerPayment entity operations.
 * Defines API endpoints for farmer payment-related CRUD operations.
 */

import { Router } from "express";
import * as FarmerPaymentController from "@/modules/farmer_payments/farmer_payment.controller";

const router = Router();

// Route to create a new farmer payment
router.post("/", FarmerPaymentController.createFarmerPayment);

// Route to get all farmer payments
router.get("/", FarmerPaymentController.getAllFarmerPayments);

// Route to get a farmer payment by ID
router.get("/:id", FarmerPaymentController.getFarmerPaymentById);

// Route to update a farmer payment's details
router.put("/:id", FarmerPaymentController.updateFarmerPayment);

// Route to delete a farmer payment
router.delete("/:id", FarmerPaymentController.deleteFarmerPayment);

export default router;
