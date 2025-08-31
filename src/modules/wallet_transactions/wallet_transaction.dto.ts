import {
  WalletTransactionType,
  PaymentStatus,
} from "@/generated/prisma/client";
import { nativeEnum, z } from "zod";

/**
 * Zod schema for creating a new wallet transaction.
 * Validates all required fields necessary for creation.
 */
export const zCreateWalletTransactionDto = {
  body: z.object({
    amount: z.number({ required_error: "Amount is required" }),
    transactionType: nativeEnum(WalletTransactionType),
    transactionStatus: nativeEnum(PaymentStatus),
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
  }),
};

// TypeScript type inferred from create schema
type CreateWalletTransactionBodyDto = z.infer<
  typeof zCreateWalletTransactionDto.body
>;
// Combined type for usage / services or elsewhere
export type CreateWalletTransactionDto = {
  body: CreateWalletTransactionBodyDto;
};

/**
 * Zod schema for updating a wallet transaction.
 * All fields are optional to support partial updates.
 */
export const zUpdateWalletTransactionDto = z.object({
  amount: z.number().optional(),
  transactionType: nativeEnum(WalletTransactionType).optional(),
  transactionStatus: nativeEnum(PaymentStatus).optional(),
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
