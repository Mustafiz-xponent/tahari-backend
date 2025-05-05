/**
 * Data Transfer Objects (DTOs) for the Payment entity
 * These interfaces define the expected shape of data when creating or updating a payment.
 */

import { z } from "zod";

const paymentStatusEnum = z.enum(["PENDING", "COMPLETED", "FAILED","REFUNDED"]);

 
/**
 * Zod schema for creating a new payment.
 */
export const zCreatePaymentDto = z.object({
  amount: z.number().positive("Amount must be a positive number"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentStatus: paymentStatusEnum,
  orderId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Order ID must be a positive integer",
    }),
  transactionId: z.string().optional(),
  walletTransactionId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Wallet Transaction ID must be a positive integer",
    })
    .optional(),
});

/**
 * TypeScript type inferred from create schema.
 */
export type CreatePaymentDto = z.infer<typeof zCreatePaymentDto>;

/**
 * Zod schema for updating a payment.
 */
export const zUpdatePaymentDto = z.object({
  amount: z.number().positive("Amount must be a positive number").optional(),
  paymentMethod: z.string().min(1, "Payment method is required").optional(),
  paymentStatus: paymentStatusEnum.optional(),
  transactionId: z.string().optional(),
  orderId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Order ID must be a positive integer",
    })
    .optional(),
  walletTransactionId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Wallet Transaction ID must be a positive integer",
    })
    .optional(),
});

/**
 * TypeScript type inferred from update schema.
 */
export type UpdatePaymentDto = z.infer<typeof zUpdatePaymentDto>;
