/**
 * Routes for Wallet entity operations.
 * Defines API endpoints for wallet-related CRUD operations.
 */

import { Router } from "express";
import * as WalletController from "@/modules/wallets/wallet.controller";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";

const router = Router();

// Route to create a new wallet
router.post("/", WalletController.createWallet);

// Route to deposite wallet
router.post(
  "/deposit",
  authMiddleware,
  authorizeRoles("CUSTOMER"),
  WalletController.initiateWalletDeposit
);

// Route to get all wallets
router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN"),
  WalletController.getAllWallets
);

// Route to get wallets for a specific customer
router.get(
  "/balance",
  authMiddleware,
  authorizeRoles("CUSTOMER"),
  WalletController.getCustomerWalletBalanace
);
// Route to get a wallet by ID
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN"),
  WalletController.getWalletById
);

// Route to update a wallet's details
router.put("/:id", WalletController.updateWallet);

// Route to delete a wallet
router.delete("/:id", WalletController.deleteWallet);

// SSLCommerz callback routes
router.post("/deposite/success", WalletController.handleSslCommerzSuccess);
router.post("/deposite/fail", WalletController.handleSslCommerzFailure);
router.post("/deposite/cancel", WalletController.handleSslCommerzCancel);
router.post("/deposite/ipn", WalletController.handleSslCommerzIPN);

export default router;
