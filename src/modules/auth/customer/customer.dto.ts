/**
 * Data Transfer Objects (DTOs) for Customer authentication
 * Defines the expected shape of data for customer authentication operations.
 */

import { z } from "zod";

const bangladeshPhoneValidator = z.string().regex(/^\+8801[3-9]\d{8}$/, {
  message: "Must be a valid Bangladesh phone number (+8801XXXXXXXXX)",
});

// Customer Registration DTO
export const zCustomerRegisterDto = z.object({
  phone: bangladeshPhoneValidator,
  name: z.string().min(3, "Name must be at least 3 characters").optional(),
  address: z.string().optional(),
});
export type CustomerRegisterDto = z.infer<typeof zCustomerRegisterDto>;

// For /login endpoint (email/phone + password)
export const zCustomerLoginDto = z
  .object({
    email: z.string().email().optional(),
    phone: bangladeshPhoneValidator.optional(),
    password: z.string().min(1, "Password is required"),
  })
  .refine((data) => data.email || data.phone, {
    message: "Either email or phone must be provided",
  });
export type CustomerLoginDto = z.infer<typeof zCustomerLoginDto>;

// For /otp-login endpoint (phone only)
export const zCustomerOtpLoginDto = z.object({
  phone: bangladeshPhoneValidator,
});
export type CustomerOtpLoginDto = z.infer<typeof zCustomerOtpLoginDto>;

// For /verify-otp endpoint
export const zCustomerVerifyOtpDto = z.object({
  phone: bangladeshPhoneValidator,
  otp: z.string().length(6, "OTP must be 6 digits"),
});
export type CustomerVerifyOtpDto = z.infer<typeof zCustomerVerifyOtpDto>;
