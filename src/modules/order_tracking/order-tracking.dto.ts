/**
 * Data Transfer Objects (DTOs) for the OrderTracking entity
 * These interfaces define the expected shape of data when creating or updating an order tracking entry.
 */

import { z } from "zod";

// Enum-like validation for OrderStatus
const orderStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "PROCESSING",
]);

/**
 * Zod schema for creating a new order tracking entry.
 */
export const zCreateOrderTrackingDto = z.object({
  status: orderStatusEnum,
  description: z.string().optional(),
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
export type CreateOrderTrackingDto = z.infer<typeof zCreateOrderTrackingDto>;

/**
 * Zod schema for updating an order tracking entry.
 */
export const zUpdateOrderTrackingDto = z.object({
  status: orderStatusEnum.optional(),
  description: z.string().optional(),
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
export type UpdateOrderTrackingDto = z.infer<typeof zUpdateOrderTrackingDto>;
