/**
 * Data Transfer Objects (DTOs) for the OrderItem entity
 * These interfaces define the expected shape of data when creating or updating an order item.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */

import { ProductUnitType } from "@/generated/prisma/client";
import { z } from "zod";

// Id validation
const idSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "ID must be a positive integer",
});

// Validation for subtotal based on quantity and unitPrice
const subtotalValidation = (data: {
  quantity: number;
  unitPrice: number;
  subtotal: number;
}) => {
  return Math.abs(data.subtotal - data.quantity * data.unitPrice) < 0.01; // Allow small floating-point errors
};

/**
 * Zod schema for creating a new order item.
 * Validates all required fields necessary for creation.
 */
export const zCreateOrderItemDto = z
  .object({
    orderId: idSchema,
    productId: idSchema,
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
    unitType: z.nativeEnum(ProductUnitType),
    packageSize: z.number().positive(),
    subtotal: z.number().nonnegative(),
  })
  .refine(subtotalValidation);

/**
 * TypeScript type inferred from create item schema.
 * Use this type in services or elsewhere.
 */
export type CreateOrderItemDto = z.infer<typeof zCreateOrderItemDto>;

/**
 * Zod schema for creating multiple order items.
 * Validates all required fields necessary for creation.
 */
export const zCreateOrderItemsDto = z.object({
  orderId: idSchema,
  items: z
    .array(
      z
        .object({
          productId: idSchema,
          quantity: z.number().int().positive(),
          unitPrice: z.number().nonnegative(),
          unitType: z.nativeEnum(ProductUnitType),
          packageSize: z.number().positive(),
          subtotal: z.number().nonnegative(),
        })
        .refine(subtotalValidation)
    )
    .min(1, "At least one order item is required"),
});

/**
 * TypeScript type inferred from create items schema.
 * Use this type in services or elsewhere.
 */
export type CreateOrderItemsDto = z.infer<typeof zCreateOrderItemsDto>;

// /**
//  * Zod schema for creating a new order item.
//  * Validates all required fields necessary for creation.
//  */
// export const zCreateOrderItemDto = z
//   .object({
//     quantity: z.number().int().positive("Quantity must be a positive integer"),
//     unitPrice: z.number().nonnegative("Unit price must be non-negative"),
//     subtotal: z.number().nonnegative("Subtotal must be non-negative"),
//     orderId: z
//       .union([z.string(), z.number()])
//       .transform(BigInt)
//       .refine((val) => val > 0n, {
//         message: "Order ID must be a positive integer",
//       }),
//     productId: z
//       .union([z.string(), z.number()])
//       .transform(BigInt)
//       .refine((val) => val > 0n, {
//         message: "Product ID must be a positive integer",
//       }),
//   })
//   .refine(subtotalValidation, {
//     message: "Subtotal must equal quantity * unitPrice",
//     path: ["subtotal"],
//   });

// /**
//  * TypeScript type inferred from create schema.
//  * Use this type in services or elsewhere.
//  */
// export type CreateOrderItemDto = z.infer<typeof zCreateOrderItemDto>;

/**
 * Zod schema for updating an order item.
 * All fields are optional to support partial updates.
 */
export const zUpdateOrderItemDto = z
  .object({
    quantity: z
      .number()
      .int()
      .positive("Quantity must be a positive integer")
      .optional(),
    unitPrice: z
      .number()
      .nonnegative("Unit price must be non-negative")
      .optional(),
    unitType: z.nativeEnum(ProductUnitType).optional(),
    packageSize: z
      .number()
      .positive("Package size must be positive")
      .optional(),
    subtotal: z
      .number()
      .nonnegative("Subtotal must be non-negative")
      .optional(),
    orderId: z
      .union([z.string(), z.number()])
      .transform(BigInt)
      .refine((val) => val > 0n, {
        message: "Order ID must be a positive integer",
      })
      .optional(),
    productId: z
      .union([z.string(), z.number()])
      .transform(BigInt)
      .refine((val) => val > 0n, {
        message: "Product ID must be a positive integer",
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (
        data.quantity !== undefined &&
        data.unitPrice !== undefined &&
        data.subtotal !== undefined
      ) {
        return subtotalValidation({
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          subtotal: data.subtotal,
        });
      }
      return true;
    },
    {
      message: "Subtotal must equal quantity * unitPrice",
      path: ["subtotal"],
    }
  );

/**
 * TypeScript type inferred from update schema.
 */
export type UpdateOrderItemDto = z.infer<typeof zUpdateOrderItemDto>;
