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
import { z } from "zod";
import { handleErrorResponse } from "../../utils/errorResponseHandler";

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
    res.status(201).json({
      success: true,
      message: "Inventory purchase created successfully",
      data: purchase,
    });
  } catch (error) {
    handleErrorResponse(error, res, "create inventory purchase");
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
    res.json({
      success: true,
      message: "Inventory purchases retrieved successfully",
      data: purchases,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch inventory purchases");
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
      throw new Error("Inventory purchase not found");
    }
    res.json({
      success: true,
      message: "Inventory purchase retrieved successfully",
      data: purchase,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch inventory purchase");
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
      success: true,
      message: "Inventory purchase updated successfully",
      data: updated,
    });
  } catch (error) {
    handleErrorResponse(error, res, "update inventory purchase");
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
    res.json({
      success: true,
      message: "Inventory purchase deleted successfully",
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete inventory purchase");
  }
};
