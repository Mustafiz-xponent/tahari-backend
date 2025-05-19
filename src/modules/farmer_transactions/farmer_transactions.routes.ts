/**
 * Routes for FarmerTransaction entity operations.
 * Defines API endpoints for farmer transaction-related CRUD operations.
 */

import { Router } from "express";
import * as FarmerTransactionController from "./farmer_transactions.controller";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

// Route to create a new farmer transaction
router.post(
  "/",
  authMiddleware("ADMIN"),
  FarmerTransactionController.createFarmerTransaction
);

// Route to get all farmer transactions
router.get("/", FarmerTransactionController.getAllFarmerTransactions);

// Route to get a farmer transaction by ID
router.get("/:id", FarmerTransactionController.getFarmerTransactionById);

// Route to update a farmer transaction's details
router.put(
  "/:id",
  authMiddleware("ADMIN"),
  FarmerTransactionController.updateFarmerTransaction
);

// Route to delete a farmer transaction
router.delete(
  "/:id",
  authMiddleware("ADMIN"),
  FarmerTransactionController.deleteFarmerTransaction
);

// Route to get all transactions by farmer ID
router.get(
  "/farmer/:farmerId",
  FarmerTransactionController.getTransactionsByFarmer
);

// Route to get all transactions by purchase ID
router.get(
  "/purchase/:purchaseId",
  FarmerTransactionController.getTransactionsByPurchase
);

export default router;
