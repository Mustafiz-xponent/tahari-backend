//src/modules/farmer_payments/farmer_payment.dto.ts

/**
 * Data Transfer Objects (DTOs) for the FarmerPayment entity
 * These interfaces define the expected shape of data when creating or updating a farmer payment.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */

import { z } from "zod";

/**
 * Zod schema for creating a new farmer payment.
 * Validates all required fields necessary for creation.
 */
export const zCreateFarmerPaymentDto = z.object({
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentDate: z.string().datetime().optional().transform((val) => (val ? new Date(val) : undefined)),
  notes: z.string().optional(),
  transactionId: z.union([z.string(), z.number()]).transform(BigInt).refine((val) => val > 0n, {
    message: "Transaction ID must be a positive integer",
  }),
  farmerFarmerId: z.union([z.string(), z.number()]).transform(BigInt).refine((val) => val > 0n, {
    message: "Farmer ID must be a positive integer",
  }).optional(),
});

/**
 * TypeScript type inferred from create schema.
 * Use this type in services or elsewhere.
 */
export type CreateFarmerPaymentDto = z.infer<typeof zCreateFarmerPaymentDto>;

/**
 * Zod schema for updating a farmer payment.
 * All fields are optional to support partial updates.
 */
export const zUpdateFarmerPaymentDto = z.object({
  amount: z.number().positive("Amount must be positive").optional(),
  paymentMethod: z.string().min(1, "Payment method is required").optional(),
  paymentDate: z.string().datetime().optional().transform((val) => (val ? new Date(val) : undefined)),
  notes: z.string().optional(),
  transactionId: z.union([z.string(), z.number()]).transform(BigInt).refine((val) => val > 0n, {
    message: "Transaction ID must be a positive integer",
  }).optional(),
  farmerFarmerId: z.union([z.string(), z.number()]).transform(BigInt).refine((val) => val > 0n, {
    message: "Farmer ID must be a positive integer",
  }).optional(),
});

/**
 * TypeScript type inferred from update schema.
 */
export type UpdateFarmerPaymentDto = z.infer<typeof zUpdateFarmerPaymentDto>;