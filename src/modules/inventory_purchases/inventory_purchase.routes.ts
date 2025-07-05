/**
 * Routes for InventoryPurchase entity operations.
 * Defines API endpoints for inventory purchase-related CRUD operations.
 */

import { Router } from "express";
import * as InventoryPurchaseController from "@/modules/inventory_purchases/inventory_purchase.controller";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";

const router = Router();

// Route to create a new inventory purchase
router.post(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  InventoryPurchaseController.createInventoryPurchase
);

// Route to get all inventory purchases
router.get("/", InventoryPurchaseController.getAllInventoryPurchases);

// Route to get an inventory purchase by ID
router.get("/:id", InventoryPurchaseController.getInventoryPurchaseById);

// Route to update an inventory purchase's details
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  InventoryPurchaseController.updateInventoryPurchase
);

// Route to delete an inventory purchase
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  InventoryPurchaseController.deleteInventoryPurchase
);

export default router;
