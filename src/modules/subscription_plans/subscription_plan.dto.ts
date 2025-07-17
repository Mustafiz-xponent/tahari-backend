/**
 * Data Transfer Objects (DTOs) for the SubscriptionPlan entity
 * These interfaces define the expected shape of data when creating or updating a subscription plan.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */

import { SubscriptionPlanType } from "@/generated/prisma/client";
import { z } from "zod";

/**
 * Zod schema for creating a new subscription plan.
 * Validates all required fields necessary for creation.
 */
export const zCreateSubscriptionPlanDto = z.object({
  name: z.string().min(1, "Name is required"),
  frequency: z.nativeEnum(SubscriptionPlanType, {
    errorMap: () => ({
      message: "Invalid frequency. Must be WEEKLY or MONTHLY.",
    }),
  }),
  price: z.number().positive("Price must be positive"),
  productId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Product ID must be a positive integer",
    }),
  description: z.string().optional(),
});

/**
 * TypeScript type inferred from create schema.
 * Use this type in services or elsewhere.
 */
export type CreateSubscriptionPlanDto = z.infer<
  typeof zCreateSubscriptionPlanDto
>;

/**
 * Zod schema for updating a subscription plan.
 * All fields are optional to support partial updates.
 */
export const zUpdateSubscriptionPlanDto = z.object({
  name: z.string().min(1, "Name is required").optional(),
  frequency: z
    .nativeEnum(SubscriptionPlanType, {
      errorMap: () => ({
        message: "Invalid frequency. Must be WEEKLY or MONTHLY.",
      }),
    })
    .optional(),
  price: z.number().positive("Price must be positive").optional(),
  productId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Product ID must be a positive integer",
    })
    .optional(),
  description: z.string().optional(),
});

/**
 * TypeScript type inferred from update schema.
 */
export type UpdateSubscriptionPlanDto = z.infer<
  typeof zUpdateSubscriptionPlanDto
>;
