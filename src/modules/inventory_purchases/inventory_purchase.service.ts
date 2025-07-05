// src/modules/inventory_purchases/inventory_purchase.service.ts

/**
 * Service layer for InventoryPurchase entity operations.
 * Contains business logic and database interactions for inventory purchases.
 */

import prisma from "@/prisma-client/prismaClient";
import { InventoryPurchase } from "@/generated/prisma/client";
import {
  CreateInventoryPurchaseDto,
  UpdateInventoryPurchaseDto,
} from "@/modules/inventory_purchases/inventory-purchase.dto";
import { getErrorMessage } from "@/utils/errorHandler";

/**
 * Create a new inventory purchase
 * @param data - Data required to create an inventory purchase
 * @returns The created inventory purchase
 * @throws Error if the inventory purchase cannot be created (e.g., invalid foreign keys)
 */
export async function createInventoryPurchase(
  data: CreateInventoryPurchaseDto
): Promise<InventoryPurchase> {
  try {
    const inventoryPurchase = await prisma.inventoryPurchase.create({
      data: {
        quantity: data.quantity,
        unitCost: data.unitCost,
        totalCost: data.totalCost,
        purchaseDate: data.purchaseDate ?? new Date(),
        status: data.status ?? "PENDING",
        notes: data.notes,
        farmerId: data.farmerId,
        productId: data.productId,
      },
    });
    return inventoryPurchase;
  } catch (error) {
    throw new Error(
      `Failed to create inventory purchase: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Retrieve all inventory purchases
 * @returns An array of all inventory purchases
 * @throws Error if the query fails
 */
export async function getAllInventoryPurchases(): Promise<InventoryPurchase[]> {
  try {
    const inventoryPurchases = await prisma.inventoryPurchase.findMany();
    return inventoryPurchases;
  } catch (error) {
    throw new Error(
      `Failed to fetch inventory purchases: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Retrieve an inventory purchase by its ID
 * @param purchaseId - The ID of the inventory purchase
 * @returns The inventory purchase if found, or null if not found
 * @throws Error if the query fails
 */
export async function getInventoryPurchaseById(
  purchaseId: BigInt
): Promise<InventoryPurchase | null> {
  try {
    const inventoryPurchase = await prisma.inventoryPurchase.findUnique({
      where: { purchaseId: Number(purchaseId) },
    });
    return inventoryPurchase;
  } catch (error) {
    throw new Error(
      `Failed to fetch inventory purchase: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Update an inventory purchase by its ID
 * @param purchaseId - The ID of the inventory purchase to update
 * @param data - Data to update the inventory purchase
 * @returns The updated inventory purchase
 * @throws Error if the inventory purchase is not found or update fails
 */
export async function updateInventoryPurchase(
  purchaseId: BigInt,
  data: UpdateInventoryPurchaseDto
): Promise<InventoryPurchase> {
  try {
    const inventoryPurchase = await prisma.inventoryPurchase.update({
      where: { purchaseId: Number(purchaseId) },
      data: {
        quantity: data.quantity,
        unitCost: data.unitCost,
        totalCost: data.totalCost,
        purchaseDate: data.purchaseDate,
        status: data.status,
        notes: data.notes,
        farmerId: data.farmerId,
        productId: data.productId,
      },
    });
    return inventoryPurchase;
  } catch (error) {
    throw new Error(
      `Failed to update inventory purchase: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Delete an inventory purchase by its ID
 * @param purchaseId - The ID of the inventory purchase to delete
 * @throws Error if the inventory purchase is not found or deletion fails
 */
export async function deleteInventoryPurchase(
  purchaseId: BigInt
): Promise<void> {
  try {
    await prisma.inventoryPurchase.delete({
      where: { purchaseId: Number(purchaseId) },
    });
  } catch (error) {
    throw new Error(
      `Failed to delete inventory purchase: ${getErrorMessage(error)}`
    );
  }
}
