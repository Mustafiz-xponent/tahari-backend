/**
 * Controller layer for InventoryPurchase entity operations.
 * Handles HTTP requests and responses for inventory purchase-related endpoints.
 */

import { Request, Response } from "express";
import * as inventoryPurchaseService from "./inventory_purchase.service";
import {
  zCreateInventoryPurchaseDto,
  zUpdateInventoryPurchaseDto,
} from "./inventory-purchase.dto";
import { ZodError, z } from "zod";

const purchaseIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Purchase ID must be a positive integer",
});

/**
 * Create a new inventory purchase
 */
export const createInventoryPurchase = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCreateInventoryPurchaseDto.parse(req.body);
    const purchase = await inventoryPurchaseService.createInventoryPurchase(
      data
    );
    res
      .status(201)
      .json({ message: "Inventory purchase created successfully", purchase });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error creating inventory purchase:", error);
    res.status(500).json({ message: "Failed to create inventory purchase" });
  }
};

/**
 * Get all inventory purchases
 */
export const getAllInventoryPurchases = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const purchases = await inventoryPurchaseService.getAllInventoryPurchases();
    res.json(purchases);
  } catch (error) {
    console.error("Error fetching inventory purchases:", error);
    res.status(500).json({ message: "Failed to fetch inventory purchases" });
  }
};

/**
 * Get a single inventory purchase by ID
 */
export const getInventoryPurchaseById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const purchaseId = purchaseIdSchema.parse(req.params.id);
    const purchase = await inventoryPurchaseService.getInventoryPurchaseById(
      purchaseId
    );
    if (!purchase) {
      res.status(404).json({ message: "Inventory purchase not found" });
      return;
    }
    res.json(purchase);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error fetching inventory purchase:", error);
    res.status(500).json({ message: "Failed to fetch inventory purchase" });
  }
};

/**
 * Update an inventory purchase by ID
 */
export const updateInventoryPurchase = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const purchaseId = purchaseIdSchema.parse(req.params.id);
    const data = zUpdateInventoryPurchaseDto.parse(req.body);
    const updated = await inventoryPurchaseService.updateInventoryPurchase(
      purchaseId,
      data
    );
    res.json({
      message: "Inventory purchase updated successfully",
      purchase: updated,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error updating inventory purchase:", error);
    res.status(500).json({ message: "Failed to update inventory purchase" });
  }
};

/**
 * Delete an inventory purchase by ID
 */
export const deleteInventoryPurchase = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const purchaseId = purchaseIdSchema.parse(req.params.id);
    await inventoryPurchaseService.deleteInventoryPurchase(purchaseId);
    res.json({ message: "Inventory purchase deleted successfully" });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error deleting inventory purchase:", error);
    res.status(500).json({ message: "Failed to delete inventory purchase" });
  }
};
