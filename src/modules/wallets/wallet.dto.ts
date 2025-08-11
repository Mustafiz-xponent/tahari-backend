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
export const zCreateWalletDto = {
  body: z.object({
    customerId: z
      .union([z.string(), z.number()])
      .transform(BigInt)
      .refine((val) => val > 0n, {
        message: "Customer ID must be a positive integer",
      }),
  }),
};

// TypeScript type inferred from create schema.
type CreateWalletBodyDto = z.infer<typeof zCreateWalletDto.body>;
// Combined type for usage
export type CreateWalletDto = {
  body: CreateWalletBodyDto;
};
/**
 * Zod schema for wallet deposite
 * Validates all required fields necessary for wallet deposite.
 */
export const zDepositeWalletDto = {
  body: z.object({
    amount: z.number().nonnegative("Amount must be non-negative"),
  }),
};
type DepositeWalletBodyDto = z.infer<typeof zDepositeWalletDto.body>;
export type DepositeWalletDto = {
  body: DepositeWalletBodyDto;
};

/**
 * Zod schema for getting single wallet by ID
 */
export const zGetWalletDto = {
  params: z.object({
    id: z
      .union([z.string(), z.number()])
      .transform(BigInt)
      .refine((val) => val > 0n, {
        message: "Wallet ID must be a positive integer",
      }),
  }),
};
type GetWalletParamsDto = z.infer<typeof zGetWalletDto.params>;
export type GetWalletDto = {
  params: GetWalletParamsDto;
};
/**
 * Zod schema for updating a wallet.
 * All fields are optional to support partial updates.
 */
export const zUpdateWalletDto = {
  params: z.object({
    id: z
      .union([z.string(), z.number()])
      .transform(BigInt)
      .refine((val) => val > 0n, {
        message: "Wallet ID must be a positive integer",
      }),
  }),
  body: z.object({
    customerId: z
      .union([z.string(), z.number()])
      .transform(BigInt)
      .refine((val) => val > 0n, {
        message: "Customer ID must be a positive integer",
      })
      .optional(),
    balance: z.number().nonnegative("Balance must be non-negative").optional(),
  }),
};

type UpdateWalletParamsDto = z.infer<typeof zUpdateWalletDto.params>;
type UpdateWalletBodyDto = z.infer<typeof zUpdateWalletDto.body>;

export type UpdateWalletDto = {
  params: UpdateWalletParamsDto;
  body: UpdateWalletBodyDto;
};

/**
 * Zod schema for deleting a wallet.
 */
export const zDeleteWalletDto = {
  params: z.object({
    id: z
      .union([z.string(), z.number()])
      .transform(BigInt)
      .refine((val) => val > 0n, {
        message: "Wallet ID must be a positive integer",
      }),
  }),
};
type DeleteWalletParamsDto = z.infer<typeof zDeleteWalletDto.params>;

export type DeleteWalletDto = {
  params: DeleteWalletParamsDto;
};
