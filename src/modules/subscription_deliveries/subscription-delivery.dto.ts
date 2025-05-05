/**
 * Data Transfer Objects (DTOs) for the SubscriptionDelivery entity
 * These interfaces define the expected shape of data when creating or updating a subscription delivery.
 */

import { z } from "zod";

const orderStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);

/**
 * Zod schema for creating a new subscription delivery.
 */
export const zCreateSubscriptionDeliveryDto = z.object({
  deliveryDate: z.string().datetime(),
  status: orderStatusEnum,
  subscriptionId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Subscription ID must be a positive integer",
    }),
  orderId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Order ID must be a positive integer",
    }),
});

/**
 * TypeScript type inferred from create schema.
 */
export type CreateSubscriptionDeliveryDto = z.infer<
  typeof zCreateSubscriptionDeliveryDto
>;

/**
 * Zod schema for updating a subscription delivery.
 */
export const zUpdateSubscriptionDeliveryDto = z.object({
  deliveryDate: z.string().datetime().optional(),
  status: orderStatusEnum.optional(),
  subscriptionId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Subscription ID must be a positive integer",
    })
    .optional(),
  orderId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Order ID must be a positive integer",
    })
    .optional(),
});

/**
 * TypeScript type inferred from update schema.
 */
export type UpdateSubscriptionDeliveryDto = z.infer<
  typeof zUpdateSubscriptionDeliveryDto
>;
