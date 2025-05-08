/**
 * Data Transfer Objects (DTOs) for Customer authentication
 * Defines the expected shape of data for customer authentication operations.
 */

import { z } from "zod";

const phoneNumberRegex = /^\+8801[3-9]\d{8}$/;

/**
 * Zod schema for customer registration.
 */
export const zCustomerRegisterDto = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  phone: z
    .string()
    .regex(phoneNumberRegex, "Invalid Bangladesh phone number")
    .optional(),
  address: z.string().optional(),
});

/**
 * TypeScript type inferred from register schema.
 */
export type CustomerRegisterDto = z.infer<typeof zCustomerRegisterDto>;

/**
 * Zod schema for customer email/password login.
 */
export const zCustomerLoginDto = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * TypeScript type inferred from login schema.
 */
export type CustomerLoginDto = z.infer<typeof zCustomerLoginDto>;

/**
 * Zod schema for customer OTP login.
 */
export const zCustomerOtpLoginDto = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(phoneNumberRegex, "Invalid Bangladesh phone number"),
});

/**
 * TypeScript type inferred from OTP login schema.
 */
export type CustomerOtpLoginDto = z.infer<typeof zCustomerOtpLoginDto>;

/**
 * Zod schema for customer OTP verification.
 */
export const zCustomerVerifyOtpDto = z.object({
  email: z.string().email("Invalid email address"),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric"),
});

/**
 * TypeScript type inferred from verify OTP schema.
 */
export type CustomerVerifyOtpDto = z.infer<typeof zCustomerVerifyOtpDto>;
