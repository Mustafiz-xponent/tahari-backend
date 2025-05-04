/**
 * Data Transfer Objects (DTOs) for the Product entity
 * These interfaces define the expected shape of data when creating or updating a product.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */

import { z } from "zod";

/**
 * Zod schema for creating a new product.
 * Validates all required fields necessary for creation.
 */
export const zCreateProductDto = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  stockQuantity: z
    .number()
    .int()
    .nonnegative("Stock quantity must be a non-negative integer")
    .optional(),
  reorderLevel: z
    .number()
    .int()
    .nonnegative("Reorder level must be a non-negative integer")
    .optional(),
  isSubscription: z.boolean().optional(),
  isPreorder: z.boolean().optional(),
  preorderAvailabilityDate: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  categoryId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Category ID must be a positive integer",
    }),
  farmerId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Farmer ID must be a positive integer",
    }),
});

/**
 * TypeScript type inferred from create schema.
 * Use this type in services or elsewhere.
 */
export type CreateProductDto = z.infer<typeof zCreateProductDto>;

/**
 * Zod schema for updating a product.
 * All fields are optional to support partial updates.
 */
export const zUpdateProductDto = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive").optional(),
  stockQuantity: z
    .number()
    .int()
    .nonnegative("Stock quantity must be a non-negative integer")
    .optional(),
  reorderLevel: z
    .number()
    .int()
    .nonnegative("Reorder level must be a non-negative integer")
    .optional(),
  isSubscription: z.boolean().optional(),
  isPreorder: z.boolean().optional(),
  preorderAvailabilityDate: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  categoryId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Category ID must be a positive integer",
    })
    .optional(),
  farmerId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Farmer ID must be a positive integer",
    })
    .optional(),
});

/**
 * TypeScript type inferred from update schema.
 */
export type UpdateProductDto = z.infer<typeof zUpdateProductDto>;
