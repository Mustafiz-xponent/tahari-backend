/**
 * Routes for Wallet entity operations.
 * Defines API endpoints for wallet-related CRUD operations.
 */

import { Router } from "express";
import * as WalletController from "./wallet.controller";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

// Route to create a new wallet
router.post("/", WalletController.createWallet);

// Route to deposite wallet
router.post(
  "/deposit",
  authMiddleware("CUSTOMER"),
  WalletController.initiateWalletDeposit
);

// Route to get all wallets
router.get("/", authMiddleware("ADMIN"), WalletController.getAllWallets);

// Route to get a wallet by ID
router.get(
  "/balance",
  authMiddleware("CUSTOMER"),
  WalletController.getCustomerWalletBalanace
);
// Route to get a wallet by ID
router.get("/:id", authMiddleware("ADMIN"), WalletController.getWalletById);

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
