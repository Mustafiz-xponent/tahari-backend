/**
 * Routes for Wallet entity operations.
 * Defines API endpoints for wallet-related CRUD operations.
 */
import { Router } from "express";
import * as WalletController from "@/modules/wallets/wallet.controller";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import { UserRole } from "@/generated/prisma/client";

const router = Router();

// Route to create a new wallet
router.post("/", WalletController.createWallet);

// Route to deposite wallet
router.post(
  "/deposit",
  authMiddleware,
  authorizeRoles(UserRole.CUSTOMER),
  WalletController.initiateWalletDeposit
);

// Route to get all wallets
router.get(
  "/",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  WalletController.getAllWallets
);

// Route to get wallets for a specific customer
router.get(
  "/balance",
  authMiddleware,
  authorizeRoles(UserRole.CUSTOMER),
  WalletController.getCustomerWalletBalanace
);
// Route to get a wallet by ID
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  WalletController.getWalletById
);

// Route to update a wallet's details
// router.put(
//   "/:id",
//   authMiddleware,
//   authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
//   WalletController.updateWallet
// );

// Route to delete a wallet
// router.delete(
//   "/:id",
//   authMiddleware,
//   authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
//   WalletController.deleteWallet
// );

// SSLCommerz callback routes
router.post("/deposite/success", WalletController.handleSslCommerzSuccess);
router.post("/deposite/fail", WalletController.handleSslCommerzFailure);
router.post("/deposite/cancel", WalletController.handleSslCommerzCancel);
router.post("/deposite/ipn", WalletController.handleSslCommerzIPN);

export default router;
