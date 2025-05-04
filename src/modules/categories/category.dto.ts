/**
 * Data Transfer Objects (DTOs) for the Category entity
 * These interfaces define the expected shape of data when creating or updating a category.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */

import { z } from "zod";

/**
 * Zod schema for creating a new category.
 * Validates all required fields necessary for creation.
 */
export const zCreateCategoryDto = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

/**
 * TypeScript type inferred from create schema.
 * Use this type in services or elsewhere.
 */
export type CreateCategoryDto = z.infer<typeof zCreateCategoryDto>;

/**
 * Zod schema for updating a category.
 * All fields are optional to support partial updates.
 */
export const zUpdateCategoryDto = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

/**
 * TypeScript type inferred from update schema.
 */
export type UpdateCategoryDto = z.infer<typeof zUpdateCategoryDto>;
