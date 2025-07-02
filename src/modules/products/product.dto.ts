/**
 * Data Transfer Objects (DTOs) for the Product entity
 * Updated to handle image uploads with product operations
 */

import { ProductUnitType } from "@/generated/prisma/client";
import { z } from "zod";

/**
 * Schema for validating product name parameter
 */
export const productNameSchema = z
  .string()
  .min(1, "Product name is required")
  .max(255, "Product name is too long");

/**
 * Zod schema for creating a new product.
 * Validates all required fields necessary for creation.
 * Images are handled separately through file upload.
 */

export const zCreateProductDto = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  unitPrice: z.coerce.number().positive("Unit price must be positive"),
  unitType: z.nativeEnum(ProductUnitType),
  packageSize: z.coerce.number().positive("Package size must be positive"),
  stockQuantity: z.coerce
    .number()
    .int()
    .nonnegative("Stock quantity must be a non-negative integer")
    .optional(),
  reorderLevel: z.coerce
    .number()
    .int()
    .nonnegative("Reorder level must be a non-negative integer")
    .optional(),
  isSubscription: z
    .union([z.boolean(), z.string()])
    .transform((val) =>
      typeof val === "string" ? val.toLowerCase() === "true" : val
    )
    .optional(),
  isPreorder: z
    .union([z.boolean(), z.string()])
    .transform((val) =>
      typeof val === "string" ? val.toLowerCase() === "true" : val
    )
    .optional(),
  preorderAvailabilityDate: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    })
    .transform((val) => (val ? new Date(val) : undefined))
    .optional(),
  categoryId: z
    .union([z.string(), z.number()])
    .transform((val) => BigInt(val))
    .refine((val) => val > 0n, {
      message: "Category ID must be a positive integer",
    }),
  farmerId: z
    .union([z.string(), z.number()])
    .transform((val) => BigInt(val))
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
 * Images are handled separately through file upload.
 */
export const zUpdateProductDto = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  unitPrice: z.coerce
    .number()
    .positive("Unit price must be positive")
    .optional(),
  unitType: z.nativeEnum(ProductUnitType).optional(),
  packageSize: z.coerce
    .number()
    .positive("Package size must be positive")
    .optional(),
  stockQuantity: z.coerce
    .number()
    .int()
    .nonnegative("Stock quantity must be a non-negative integer")
    .optional(),
  reorderLevel: z.coerce
    .number()
    .int()
    .nonnegative("Reorder level must be a non-negative integer")
    .optional(),
  isSubscription: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (typeof val === "string") {
        return val.toLowerCase() === "true";
      }
      return val;
    })
    .optional(),
  isPreorder: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (typeof val === "string") {
        return val.toLowerCase() === "true";
      }
      return val;
    })
    .optional(),
  preorderAvailabilityDate: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  imageUrls: z.array(z.string().url()).optional(), // For manual URL management
  categoryId: z
    .union([z.string(), z.number()])
    .transform((val) => BigInt(val))
    .refine((val) => val > 0n, {
      message: "Category ID must be a positive integer",
    })
    .optional(),
  farmerId: z
    .union([z.string(), z.number()])
    .transform((val) => BigInt(val))
    .refine((val) => val > 0n, {
      message: "Farmer ID must be a positive integer",
    })
    .optional(),
  replaceImages: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (typeof val === "string") {
        return val.toLowerCase() === "true";
      }
      return val;
    })
    .optional()
    .default(false), // Whether to replace existing images or add to them
});

/**
 * TypeScript type inferred from update schema.
 */
export type UpdateProductDto = z.infer<typeof zUpdateProductDto>;

/**
 * Schema for removing specific images from a product
 */
export const zRemoveProductImagesDto = z.object({
  productId: z
    .union([z.string(), z.number()])
    .transform((val) => BigInt(val))
    .refine((val) => val > 0n, {
      message: "Product ID must be a positive integer",
    }),
  imageUrls: z
    .array(z.string().url())
    .min(1, "At least one image URL is required"),
});

export type RemoveProductImagesDto = z.infer<typeof zRemoveProductImagesDto>;

/**
 * Schema for product query parameters
 */
export const zProductQueryDto = z.object({
  include: z.enum(["relations"]).optional(),
  category: z.string().optional(),
  farmer: z.string().optional(),
  isSubscription: z
    .string()
    .transform((val) => val.toLowerCase() === "true")
    .optional(),
  isPreorder: z
    .string()
    .transform((val) => val.toLowerCase() === "true")
    .optional(),
});

export type ProductQueryDto = z.infer<typeof zProductQueryDto>;
