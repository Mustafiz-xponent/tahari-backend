/**
 * Routes for Wallet entity operations.
 * Defines API endpoints for wallet-related CRUD operations.
 */

import { Router } from "express";
import * as WalletController from "./wallet.controller";

const router = Router();

// Route to create a new wallet
router.post("/", WalletController.createWallet);

// Route to get all wallets
router.get("/", WalletController.getAllWallets);

// Route to get a wallet by ID
router.get("/:id", WalletController.getWalletById);

// Route to update a wallet's details
router.put("/:id", WalletController.updateWallet);

// Route to delete a wallet
router.delete("/:id", WalletController.deleteWallet);

export default router;
