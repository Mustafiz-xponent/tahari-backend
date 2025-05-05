/**
 * Data Transfer Objects (DTOs) for the Subscription entity
 * These interfaces define the expected shape of data when creating or updating a subscription.
 */

import { z } from "zod";

const subscriptionStatusEnum = z.enum([
  "ACTIVE",
  "CANCELLED",
  "EXPIRED",
  "PENDING",
]);

/**
 * Zod schema for creating a new subscription.
 */
export const zCreateSubscriptionDto = z.object({
  startDate: z.string().datetime(),
  status: subscriptionStatusEnum,
  customerId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Customer ID must be a positive integer",
    }),
  planId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Plan ID must be a positive integer",
    }),
  endDate: z.string().datetime().optional(),
  renewalDate: z.string().datetime().optional(),
});

/**
 * TypeScript type inferred from create schema.
 */
export type CreateSubscriptionDto = z.infer<typeof zCreateSubscriptionDto>;

/**
 * Zod schema for updating a subscription.
 */
export const zUpdateSubscriptionDto = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: subscriptionStatusEnum.optional(),
  renewalDate: z.string().datetime().optional(),
  customerId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Customer ID must be a positive integer",
    })
    .optional(),
  planId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Plan ID must be a positive integer",
    })
    .optional(),
});

/**
 * TypeScript type inferred from update schema.
 */
export type UpdateSubscriptionDto = z.infer<typeof zUpdateSubscriptionDto>;
