/**
 * Service layer for Customer authentication operations.
 * Handles registration, login, OTP generation, verification, and JWT issuance for customers.
 */

import bcrypt from "bcrypt";
import { User } from "../../../../generated/prisma/client";
import prisma from "../../../prisma-client/prismaClient";
import { generateAuthToken } from "../../../utils/authToken";
import { getErrorMessage } from "../../../utils/errorHandler";
import { sendOtp, verifyOtp } from "../../../utils/otpService";
import {
  CustomerLoginDto,
  CustomerOtpLoginDto,
  CustomerRegisterDto,
  CustomerVerifyOtpDto,
} from "./customer.dto";

/**
 * Register new customer with phone number
 */
export async function registerCustomer(
  data: CustomerRegisterDto
): Promise<{ user: Omit<User, "passwordHash"> }> {
  try {
    // Validate phone number uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { phone: data.phone },
    });
    if (existingUser) {
      throw new Error("Phone number already registered");
    }

    // Create user record without password
    const user = await prisma.user.create({
      data: {
        phone: data.phone,
        name: data.name,
        address: data.address,
        role: "CUSTOMER",
        status: "PENDING",
        customer: { create: {} },
      },
    });

    // Send verification OTP
    await sendOtp(data.phone);

    // Return user data without sensitive fields
    const { passwordHash, ...userData } = user;
    return { user: userData };
  } catch (error) {
    throw new Error(`Failed to register customer: ${getErrorMessage(error)}`);
  }
}

/**
 * Login customer with email/phone and password
 */
export async function loginCustomer(
  data: CustomerLoginDto
): Promise<{ token: string; user: User }> {
  // Determine identifier (email or phone)
  const identifier = data.email
    ? { email: data.email }
    : { phone: data.phone! };

  const user = await prisma.user.findUnique({
    where: identifier,
  });

  if (!user || user.role !== "CUSTOMER") {
    throw new Error("Customer not found");
  }

  if (!user.passwordHash) {
    throw new Error("Password login not enabled for this account");
  }

  const isValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid password");
  }

  return generateAuthToken(user);
}

/**
 * OTP login customer
 */
export async function otpLoginCustomer(
  data: CustomerOtpLoginDto
): Promise<void> {
  await prisma.user.upsert({
    where: { phone: data.phone },
    update: {}, // No updates needed if user exists
    create: {
      phone: data.phone,
      role: "CUSTOMER",
      status: "PENDING",
      customer: { create: {} },
    },
  });

  await sendOtp(data.phone);
}

/**
 * Verify OTP
 */
export async function verifyCustomerOtp(
  data: CustomerVerifyOtpDto
): Promise<{ token: string; user: User }> {
  const otpRecord = await prisma.otp.findFirst({
    where: { phone: data.phone, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  console.log("OTP record:", otpRecord);

  if (!otpRecord || otpRecord.expiresAt < new Date()) {
    throw new Error("Invalid or expired OTP");
  }

  const isValidOtp = await verifyOtp(data.phone, data.otp);
  if (!isValidOtp) {
    throw new Error("Invalid OTP");
  }

  const user = await prisma.user.findUnique({
    where: { phone: data.phone },
  });

  if (!user || user.role !== "CUSTOMER") {
    throw new Error("Customer not found");
  }

  const updatedUser = await prisma.user.update({
    where: { phone: data.phone },
    data: { status: "ACTIVE" },
  });

  await prisma.otp.deleteMany({
    where: { phone: data.phone },
  });

  return generateAuthToken(updatedUser);
}
