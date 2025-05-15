// src/farmers/farmer.dto.ts

/**
 * Data Transfer Objects (DTOs) for the Farmer entity
 * These interfaces define the expected shape of data when creating or updating a farmer.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */

import { z } from "zod";

/**
 * Zod schema for creating a new farmer.
 * Validates all required fields necessary for creation.
 */
export const zCreateFarmerDto = z.object({
  name: z.string().min(1, "Name is required"),
  farmName: z.string().min(1, "Farm name is required"),
  address: z.string().min(1, "Address is required"),
  contactInfo: z.string().optional(),
});

/**
 * TypeScript type inferred from create schema.
 * Use this type in services or elsewhere.
 */
export type CreateFarmerDto = z.infer<typeof zCreateFarmerDto>;

/**
 * Zod schema for updating a farmer.
 * All fields are optional to support partial updates.
 */
export const zUpdateFarmerDto = z.object({
  name: z.string().min(1).optional(),
  farmName: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  contactInfo: z.string().optional(),
});

/**
 * TypeScript type inferred from update schema.
 */
export type UpdateFarmerDto = z.infer<typeof zUpdateFarmerDto>;
