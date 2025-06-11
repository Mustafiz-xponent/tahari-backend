// src/modules/stock_transactions/stock_transaction.dto.ts

/**
 * Data Transfer Objects (DTOs) for the StockTransaction entity
 * These interfaces define the expected shape of data when creating or updating a stock transaction.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */

import { z } from "zod";

// Assuming TransactionType enum values (adjust based on your Prisma schema)
const transactionTypeEnum = z.enum(["IN", "OUT", "ADJUSTMENT"]);

/**
 * Zod schema for creating a new stock transaction.
 * Validates all required fields necessary for creation.
 */
export const zCreateStockTransactionDto = z.object({
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  transactionType: transactionTypeEnum,
  productId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Product ID must be a positive integer",
    }),
  purchaseId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Purchase ID must be a positive integer",
    })
    .optional(),
  orderId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Order ID must be a positive integer",
    })
    .optional(),
  description: z.string().optional(),
});

/**
 * TypeScript type inferred from create schema.
 * Use this type in services or elsewhere.
 */
export type CreateStockTransactionDto = z.infer<
  typeof zCreateStockTransactionDto
>;

/**
 * Zod schema for creating stock transactions - always expects an array
 */
export const zCreateStockTransactionArrayDto = z
  .array(zCreateStockTransactionDto)
  .min(1, "At least one transaction is required")
  .max(100, "Maximum 100 transactions allowed per request");

/**
 * TypeScript type inferred from create schema.
 * Use this type in services or elsewhere.
 */
export type CreateStockTransactionArrayDto = z.infer<
  typeof zCreateStockTransactionArrayDto
>;

/**
 * Zod schema for updating a stock transaction.
 * All fields are optional to support partial updates.
 */
export const zUpdateStockTransactionDto = z.object({
  quantity: z
    .number()
    .int()
    .positive("Quantity must be a positive integer")
    .optional(),
  transactionType: transactionTypeEnum.optional(),
  productId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Product ID must be a positive integer",
    })
    .optional(),
  purchaseId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Purchase ID must be a positive integer",
    })
    .optional(),
  orderId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Order ID must be a positive integer",
    })
    .optional(),
  description: z.string().optional(),
});

/**
 * TypeScript type inferred from update schema.
 */
export type UpdateStockTransactionDto = z.infer<
  typeof zUpdateStockTransactionDto
>;
