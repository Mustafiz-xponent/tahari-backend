/**
 * Routes for InventoryPurchase entity operations.
 * Defines API endpoints for inventory purchase-related CRUD operations.
 */

import { Router } from "express";
import * as InventoryPurchaseController from "./inventory_purchase.controller";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

// Route to create a new inventory purchase
router.post(
  "/",
  authMiddleware("ADMIN"),
  InventoryPurchaseController.createInventoryPurchase
);

// Route to get all inventory purchases
router.get("/", InventoryPurchaseController.getAllInventoryPurchases);

// Route to get an inventory purchase by ID
router.get("/:id", InventoryPurchaseController.getInventoryPurchaseById);

// Route to update an inventory purchase's details
router.put(
  "/:id",
  authMiddleware("ADMIN"),
  InventoryPurchaseController.updateInventoryPurchase
);

// Route to delete an inventory purchase
router.delete(
  "/:id",
  authMiddleware("ADMIN"),
  InventoryPurchaseController.deleteInventoryPurchase
);

export default router;
