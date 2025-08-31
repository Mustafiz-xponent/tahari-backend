import {
  WalletTransactionType,
  PaymentStatus,
} from "@/generated/prisma/client";
import { nativeEnum, z } from "zod";

const zBigIntId = (fieldName: string) =>
  z
    .union([z.string(), z.number()])
    .refine((val) => val !== "", { message: `${fieldName} is required` })
    .transform((val) => BigInt(val))
    .refine((val) => val > 0n, {
      message: `${fieldName} must be a positive integer`,
    });

/**
 * Zod schema for creating a new wallet transaction.
 * Validates all required fields necessary for creation.
 */
export const zCreateWalletTransactionDto = {
  body: z.object({
    amount: z.number({ required_error: "Amount is required" }),
    transactionType: nativeEnum(WalletTransactionType),
    transactionStatus: nativeEnum(PaymentStatus),
    walletId: zBigIntId("Wallet ID"),
    orderId: zBigIntId("Order ID").optional(),
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
export const zUpdateWalletTransactionDto = {
  params: z.object({
    id: zBigIntId("Wallet Transaction ID"),
  }),
  body: z.object({
    amount: z.number().optional(),
    transactionType: nativeEnum(WalletTransactionType).optional(),
    transactionStatus: nativeEnum(PaymentStatus).optional(),
    walletId: zBigIntId("Wallet ID").optional(),
    orderId: zBigIntId("Order ID").optional(),
    description: z.string().min(1, "Description must not be empty").optional(),
  }),
};

/**
 * TypeScript type inferred from update schema.
 */
type UpdateWalletTransactionBodyDto = z.infer<
  typeof zUpdateWalletTransactionDto.body
>;
type UpdateWalletTransactionParamsDto = z.infer<
  typeof zUpdateWalletTransactionDto.params
>;
// Combined type for usage / services or elsewhere
export type UpdateWalletTransactionDto = {
  params: UpdateWalletTransactionParamsDto;
  body: UpdateWalletTransactionBodyDto;
};

/**
 * Zod schema for getting a wallet transaction by ID.
 */
export const zGetWalletTransactionDto = {
  params: z.object({
    id: zBigIntId("Wallet Transaction ID"),
  }),
};

/**
 * TypeScript type inferred from get schema.
 */
type GetWalletTransactionParamsDto = z.infer<
  typeof zGetWalletTransactionDto.params
>;
// Combined type for usage / services or elsewhere etc(. GetWalletTransactionDto['params'])
export type GetWalletTransactionDto = {
  params: GetWalletTransactionParamsDto;
};

/**
 * Zod schema for deleting a wallet transaction by ID.
 */
export const zDeleteWalletTransactionDto = {
  params: z.object({
    id: zBigIntId("Wallet Transaction ID"),
  }),
};

/**
 * TypeScript type inferred from delete schema.
 */
type DeleteWalletTransactionParamsDto = z.infer<
  typeof zDeleteWalletTransactionDto.params
>;
// Combined type for usage / services or elsewhere
export type DeleteWalletTransactionDto = {
  params: DeleteWalletTransactionParamsDto;
};
