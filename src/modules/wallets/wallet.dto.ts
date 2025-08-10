/**
 * Data Transfer Objects (DTOs) for the Wallet entity
 * These interfaces define the expected shape of data when creating or updating a wallet.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */

import { z } from "zod";
/**
 * Zod schema for creating a new wallet.
 * Validates all required fields necessary for creation.
 */
export const zCreateWalletDto = z.object({
  customerId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Customer ID must be a positive integer",
    }),
});

/**
 * TypeScript type inferred from create schema.
 * Use this type in services or elsewhere.
 */
export type CreateWalletDto = z.infer<typeof zCreateWalletDto>;

/**
 * Zod schema for updating a wallet.
 * All fields are optional to support partial updates.
 */
export const zUpdateWalletDto = z.object({
  customerId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Customer ID must be a positive integer",
    })
    .optional(),
  balance: z.number().nonnegative("Balance must be non-negative").optional(),
});

/**
 * TypeScript type inferred from update schema.
 */
export type UpdateWalletDto = z.infer<typeof zUpdateWalletDto>;
