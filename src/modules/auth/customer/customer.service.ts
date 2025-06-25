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
  CustomerUpdateProfileDto,
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

    // Hash the password before storing
    const saltRounds = 10;
    const passwordHash = data.password
      ? await bcrypt.hash(data.password, saltRounds)
      : null;

    // Create user record with hashed password
    const user = await prisma.user.create({
      data: {
        phone: data.phone,
        name: data.name,
        address: data.address || [],
        passwordHash: passwordHash,
        role: "CUSTOMER",
        status: "PENDING",
        customer: { create: {} },
      },
    });

    // Send verification OTP
    await sendOtp(data.phone);

    // Return user data without sensitive fields
    const { passwordHash: _, ...userData } = user;
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
    include: {
      customer: {
        include: {
          wallet: true,
        },
      },
    },
  });

  if (!user || user.role !== "CUSTOMER") {
    throw new Error("Customer not found");
  }
  // create customer wallet if not exist--
  if (user.customer && !user.customer.wallet) {
    await prisma.wallet.create({
      data: {
        customerId: user.customer.customerId,
      },
    });
  }

  const updatedUser = await prisma.user.update({
    where: { phone: data.phone },
    data: { status: "ACTIVE" },
    include: {
      customer: {
        include: {
          wallet: true,
        },
      },
    },
  });
  console.log(user);
  await prisma.otp.deleteMany({
    where: { phone: data.phone },
  });

  return generateAuthToken(updatedUser);
}

/**
 * Update customer profile
 */
export async function updateCustomerProfile(
  userId: bigint,
  data: CustomerUpdateProfileDto
): Promise<User> {
  const updateData: {
    name?: string;
    email?: string;
    address?: string[];
    passwordHash?: string;
    updatedAt?: Date;
  } = {
    updatedAt: new Date(), // Always update the updatedAt field
  };

  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;
  if (data.address) updateData.address = data.address;

  // Handle password update with hashing
  if (data.password) {
    const saltRounds = 10;
    updateData.passwordHash = await bcrypt.hash(data.password, saltRounds);
  }

  // Check if any fields were actually provided (beyond updatedAt)
  const hasUpdates = Object.keys(updateData).some(
    (key) =>
      key !== "updatedAt" &&
      updateData[key as keyof typeof updateData] !== undefined
  );

  if (!hasUpdates) {
    throw new Error("No valid fields provided for update");
  }

  return await prisma.user.update({
    where: { userId },
    data: updateData,
  });
}

/**
 * Get customer by ID
 * @throws Error if customer not found or unauthorized
 */
export async function getCustomerById(
  userId: bigint
): Promise<Omit<User, "passwordHash">> {
  const user = await prisma.user.findUnique({
    where: { userId },
    include: { customer: true },
  });

  if (!user) {
    throw new Error("Customer not found");
  }
  if (user.role !== "CUSTOMER") {
    throw new Error("User is not a customer");
  }

  const { passwordHash, ...customerData } = user;
  return customerData;
}
