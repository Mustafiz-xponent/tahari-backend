// src/modules/inventory_purchases/inventory-purchase.dto.ts

/**
 * Data Transfer Objects (DTOs) for the InventoryPurchase entity
 * These interfaces define the expected shape of data when creating or updating an inventory purchase.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */

import { z } from "zod";

// Assuming InventoryPurchaseStatus enum values (adjust based on your Prisma schema)
const inventoryPurchaseStatusEnum = z.enum([
  "PENDING",
  "COMPLETED",
  "CANCELLED",
]);

/**
 * Zod schema for creating a new inventory purchase.
 * Validates all required fields necessary for creation.
 */
export const zCreateInventoryPurchaseDto = z.object({
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  unitCost: z.number().positive("Unit cost must be positive"),
  totalCost: z.number().positive("Total cost must be positive"),
  purchaseDate: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  status: inventoryPurchaseStatusEnum.optional(),
  notes: z.string().optional(),
  farmerId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Farmer ID must be a positive integer",
    }),
  productId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Product ID must be a positive integer",
    }),
});

/**
 * TypeScript type inferred from create schema.
 * Use this type in services or elsewhere.
 */
export type CreateInventoryPurchaseDto = z.infer<
  typeof zCreateInventoryPurchaseDto
>;

/**
 * Zod schema for updating an inventory purchase.
 * All fields are optional to support partial updates.
 */
export const zUpdateInventoryPurchaseDto = z.object({
  quantity: z
    .number()
    .int()
    .positive("Quantity must be a positive integer")
    .optional(),
  unitCost: z.number().positive("Unit cost must be positive").optional(),
  totalCost: z.number().positive("Total cost must be positive").optional(),
  purchaseDate: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  status: inventoryPurchaseStatusEnum.optional(),
  notes: z.string().optional(),
  farmerId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Farmer ID must be a positive integer",
    })
    .optional(),
  productId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Product ID must be a positive integer",
    })
    .optional(),
});

/**
 * TypeScript type inferred from update schema.
 */
export type UpdateInventoryPurchaseDto = z.infer<
  typeof zUpdateInventoryPurchaseDto
>;
