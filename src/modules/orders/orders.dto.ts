/**
 * Data Transfer Objects (DTOs) for the Order entity
 * These interfaces define the expected shape of data when creating or updating an order.
 * You can also use these types with validation libraries like Zod or Joi if needed.
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

// Enum-like validation for PaymentStatus
const paymentStatusEnum = z.enum([
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
]);

/**
 * Zod schema for creating a new order.
 * Validates all required fields necessary for creation.
 */
export const zCreateOrderDto = z.object({
  status: orderStatusEnum,
  totalAmount: z.number().nonnegative("Total amount must be non-negative"),
  paymentMethod: z.string().min(1, "Payment method must not be empty"),
  paymentStatus: paymentStatusEnum,
  shippingAddress: z.string().min(1, "Shipping address must not be empty"),
  customerId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Customer ID must be a positive integer",
    }),
  isSubscription: z.boolean().optional(),
  isPreorder: z.boolean().optional(),
  preorderDeliveryDate: z
    .string()
    .datetime()
    .refine((val) => new Date(val) > new Date(), {
      message: "Preorder delivery date must be in the future",
    })
    .optional(),
});

/**
 * TypeScript type inferred from create schema.
 * Use this type in services or elsewhere.
 */
export type CreateOrderDto = z.infer<typeof zCreateOrderDto>;

/**
 * Zod schema for updating an order.
 * All fields are optional to support partial updates.
 */
export const zUpdateOrderDto = z.object({
  status: orderStatusEnum.optional(),

  paymentMethod: z
    .string()
    .min(1, "Payment method must not be empty")
    .optional(),
  paymentStatus: paymentStatusEnum.optional(),
  shippingAddress: z
    .string()
    .min(1, "Shipping address must not be empty")
    .optional(),
  preorderDeliveryDate: z
    .string()
    .datetime()
    .refine((val) => new Date(val) > new Date(), {
      message: "Preorder delivery date must be in the future",
    })
    .optional(),
  // totalAmount: z
  //   .number()
  //   .nonnegative("Total amount must be non-negative")
  //   .optional(),
  // customerId: z
  //   .union([z.string(), z.number()])
  //   .transform(BigInt)
  //   .refine((val) => val > 0n, {
  //     message: "Customer ID must be a positive integer",
  //   })
  //   .optional(),
  // isSubscription: z.boolean().optional(),
  // isPreorder: z.boolean().optional(),
});

/**
 * TypeScript type inferred from update schema.
 */
export type UpdateOrderDto = z.infer<typeof zUpdateOrderDto>;
