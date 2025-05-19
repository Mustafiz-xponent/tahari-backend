/**
 * Data Transfer Objects (DTOs) for the FarmerTransaction entity
 * These interfaces define the expected shape of data when creating or updating a farmer transaction.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */

import { z } from "zod";

// Assuming PaymentStatus enum values (adjust based on your Prisma schema)
const paymentStatusEnum = z.enum([
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
]);

/**
 * Zod schema for creating a new farmer transaction.
 * Validates all required fields necessary for creation.
 */
export const zCreateFarmerTransactionDto = z.object({
  amountDue: z.number().positive("Amount due must be positive"),
  amountPaid: z.number().min(0, "Amount paid cannot be negative").default(0),
  paymentStatus: paymentStatusEnum.optional().default("PENDING"),
  farmerId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Farmer ID must be a positive integer",
    }),
  purchaseId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Purchase ID must be a positive integer",
    }),
});

/**
 * TypeScript type inferred from create schema.
 * Use this type in services or elsewhere.
 */
export type CreateFarmerTransactionDto = z.infer<
  typeof zCreateFarmerTransactionDto
>;

/**
 * Zod schema for updating a farmer transaction.
 * All fields are optional to support partial updates.
 */
export const zUpdateFarmerTransactionDto = z.object({
  amountPaid: z.number().min(0, "Amount paid cannot be negative").optional(),
  paymentStatus: paymentStatusEnum.optional(),
});

/**
 * TypeScript type inferred from update schema.
 */
export type UpdateFarmerTransactionDto = z.infer<
  typeof zUpdateFarmerTransactionDto
>;
