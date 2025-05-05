/**
 * Data Transfer Objects (DTOs) for the Customer entity
 * These interfaces define the expected shape of data when creating or updating a customer.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */

import { z } from "zod";

/**
 * Zod schema for creating a new customer.
 * Validates all required fields necessary for creation.
 */
export const zCreateCustomerDto = z.object({
  firebaseUid: z.string().min(1, "Firebase UID is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  phone: z
    .string()
    .regex(/^\+?[\d\s()-]{7,}$/, "Invalid phone number format")
    .optional(),
  address: z.string().min(1, "Address is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

/**
 * TypeScript type inferred from create schema.
 * Use this type in services or elsewhere.
 */
export type CreateCustomerDto = z.infer<typeof zCreateCustomerDto>;

/**
 * Zod schema for updating a customer.
 * All fields are optional to support partial updates.
 */
export const zUpdateCustomerDto = z.object({
  firebaseUid: z.string().min(1, "Firebase UID is required").optional(),
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email format").optional(),
  phone: z
    .string()
    .regex(/^\+?[\d\s()-]{7,}$/, "Invalid phone number format")
    .optional(),
  address: z.string().min(1, "Address is required").optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .optional(),
});

/**
 * TypeScript type inferred from update schema.
 */
export type UpdateCustomerDto = z.infer<typeof zUpdateCustomerDto>;
