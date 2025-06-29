/**
 * Data Transfer Objects (DTOs) for Admin authentication
 * Defines the expected shape of data for admin authentication operations.
 */
import { z } from "zod";

const bangladeshPhoneValidator = z
  .string()
  .regex(
    /^\+8801[3-9]\d{8}$/,
    "Must be a valid Bangladeshi phone number (+8801XXXXXXXXX)"
  );

/**
 * Zod schema for creating an admin by super admin.
 */
export const zCreateAdminDto = z.object({
  email: z.string().email(),
  phone: bangladeshPhoneValidator,
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().array().optional(),
});

/**
 * TypeScript type inferred from create schema.
 */
export type CreateAdminDto = z.infer<typeof zCreateAdminDto>;

/**
 * Zod schema for admin email/password login.
 */
export const zAdminLoginDto = z
  .object({
    email: z.string().email().optional(),
    phone: bangladeshPhoneValidator.optional(),
    password: z.string().optional(),
  })
  .refine((data) => (data.email || data.phone) && data.password, {
    message: "Must provide email/phone with password",
  });
export type AdminLoginDto = z.infer<typeof zAdminLoginDto>;

export const zAdminOtpRequestDto = z.object({
  phone: bangladeshPhoneValidator,
});

/**
 * TypeScript type inferred from login schema.
 */
export type AdminOtpRequestDto = z.infer<typeof zAdminOtpRequestDto>;
