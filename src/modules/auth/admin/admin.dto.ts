/**
 * Data Transfer Objects (DTOs) for Admin authentication
 * Defines the expected shape of data for admin authentication operations.
 */

import { z } from "zod";

/**
 * Zod schema for creating an admin by super admin.
 */
export const zCreateAdminDto = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
});

/**
 * TypeScript type inferred from create schema.
 */
export type CreateAdminDto = z.infer<typeof zCreateAdminDto>;

/**
 * Zod schema for admin email/password login.
 */
export const zAdminLoginDto = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * TypeScript type inferred from login schema.
 */
export type AdminLoginDto = z.infer<typeof zAdminLoginDto>;
