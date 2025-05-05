/**
 * Data Transfer Objects (DTOs) for the WalletTransaction entity
 * These interfaces define the expected shape of data when creating or updating a wallet transaction.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */

import { z } from "zod";

// Enum-like validation for TransactionType
const transactionTypeEnum = z.enum([
  "DEPOSIT",
  "WITHDRAWAL",
  "PURCHASE",
  "REFUND",
]);

// Enum-like validation for PaymentStatus
const paymentStatusEnum = z.enum(["PENDING", "COMPLETED", "FAILED"]);

/**
 * Zod schema for creating a new wallet transaction.
 * Validates all required fields necessary for creation.
 */
export const zCreateWalletTransactionDto = z.object({
  amount: z.number({ required_error: "Amount is required" }),
  transactionType: transactionTypeEnum,
  transactionStatus: paymentStatusEnum,
  walletId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Wallet ID must be a positive integer",
    }),
  orderId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Order ID must be a positive integer",
    })
    .optional(),
  description: z.string().min(1, "Description must not be empty").optional(),
});

/**
 * TypeScript type inferred from create schema.
 * Use this type in services or elsewhere.
 */
export type CreateWalletTransactionDto = z.infer<
  typeof zCreateWalletTransactionDto
>;

/**
 * Zod schema for updating a wallet transaction.
 * All fields are optional to support partial updates.
 */
export const zUpdateWalletTransactionDto = z.object({
  amount: z.number().optional(),
  transactionType: transactionTypeEnum.optional(),
  transactionStatus: paymentStatusEnum.optional(),
  walletId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Wallet ID must be a positive integer",
    })
    .optional(),
  orderId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Order ID must be a positive integer",
    })
    .optional(),
  description: z.string().min(1, "Description must not be empty").optional(),
});

/**
 * TypeScript type inferred from update schema.
 */
export type UpdateWalletTransactionDto = z.infer<
  typeof zUpdateWalletTransactionDto
>;
