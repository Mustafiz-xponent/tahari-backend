/**
 * Controller layer for InventoryPurchase entity operations.
 * Handles HTTP requests and responses for inventory purchase-related endpoints.
 */

import { Request, Response } from "express";
import * as inventoryPurchaseService from "@/modules/inventory_purchases/inventory_purchase.service";
import {
  zCreateInventoryPurchaseDto,
  zUpdateInventoryPurchaseDto,
} from "@/modules/inventory_purchases/inventory-purchase.dto";
import { z } from "zod";
import { handleErrorResponse } from "@/utils/errorResponseHandler";
import httpStatus from "http-status";
import sendResponse from "@/utils/sendResponse";
import { InventoryPurchase } from "@/generated/prisma/client";

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
    sendResponse<InventoryPurchase>(res, {
      success: true,
      statusCode: httpStatus.CREATED,
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
    sendResponse<InventoryPurchase[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
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
    sendResponse<InventoryPurchase>(res, {
      success: true,
      statusCode: httpStatus.OK,
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
    const updatedInventoryPurchase =
      await inventoryPurchaseService.updateInventoryPurchase(purchaseId, data);
    sendResponse<InventoryPurchase>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Inventory purchase updated successfully",
      data: updatedInventoryPurchase,
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
    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Inventory purchase deleted successfully",
      data: null,
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete inventory purchase");
  }
};
