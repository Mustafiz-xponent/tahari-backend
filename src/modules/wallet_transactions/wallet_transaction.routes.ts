/**
 * Routes for WalletTransaction entity operations.
 * Defines API endpoints for wallet transaction-related CRUD operations.
 */

import { Router } from "express";
import * as WalletTransactionController from "./wallet_transaction.controller"

const router = Router();

// Route to create a new wallet transaction
router.post("/", WalletTransactionController.createWalletTransaction);

// Route to get all wallet transactions
router.get("/", WalletTransactionController.getAllWalletTransactions);

// Route to get a wallet transaction by ID
router.get("/:id", WalletTransactionController.getWalletTransactionById);

// Route to update a wallet transaction's details
router.put("/:id", WalletTransactionController.updateWalletTransaction);

// Route to delete a wallet transaction
router.delete("/:id", WalletTransactionController.deleteWalletTransaction);

export default router;
