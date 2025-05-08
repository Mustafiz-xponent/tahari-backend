/**
 * Service layer for Customer authentication operations.
 * Handles registration, login, OTP generation, verification, and JWT issuance for customers.
 */

import prisma from "../../../prisma-client/prismaClient";
import { User } from "../../../../generated/prisma/client";
import {
  CustomerRegisterDto,
  CustomerLoginDto,
  CustomerOtpLoginDto,
  CustomerVerifyOtpDto,
} from "./customer.dto";
import { getErrorMessage } from "@/utils/errorHandler";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import axios from "axios";

const OTP_EXPIRY_MINUTES = 5;
const JWT_EXPIRY = "1d";
const SALT_ROUNDS = 10;

/**
 * Register a new customer
 */
export async function registerCustomer(
  data: CustomerRegisterDto
): Promise<void> {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new Error("Email already registered");
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        phone: data.phone,
        address: data.address,
        passwordHash,
        role: "CUSTOMER",
        status: data.phone ? "PENDING" : "ACTIVE",
        customer: { create: {} },
      },
    });

    if (data.phone) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      await prisma.otp.create({
        data: {
          email: data.email,
          otpHash,
          expiresAt,
        },
      });

      const smsPayload = {
        api_key: process.env.SMS_API_KEY,
        sender_id: process.env.SMS_SENDER_ID,
        number: data.phone,
        message: `Your OTP for registration is ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
      };

      await axios.post(process.env.SMS_API_URL!, smsPayload);
    }
  } catch (error) {
    throw new Error(`Failed to register customer: ${getErrorMessage(error)}`);
  }
}

/**
 * Login customer with email and password
 */
export async function loginCustomer(
  data: CustomerLoginDto
): Promise<{ token: string; user: User }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user || user.role !== "CUSTOMER") {
      throw new Error("Customer not found");
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid password");
    }

    const token = jwt.sign(
      { userId: user.userId, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: JWT_EXPIRY }
    );

    return { token, user };
  } catch (error) {
    throw new Error(`Failed to login customer: ${getErrorMessage(error)}`);
  }
}

/**
 * Initiate OTP login for customer
 */
export async function otpLoginCustomer(
  data: CustomerOtpLoginDto
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user || user.role !== "CUSTOMER") {
      throw new Error("Customer not found");
    }
    if (user.phone !== data.phone) {
      throw new Error("Phone number does not match registered phone");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.otp.create({
      data: {
        email: data.email,
        otpHash,
        expiresAt,
      },
    });

    const smsPayload = {
      api_key: process.env.SMS_API_KEY,
      sender_id: process.env.SMS_SENDER_ID,
      number: data.phone,
      message: `Your login OTP is ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
    };

    await axios.post(process.env.SMS_API_URL!, smsPayload);
  } catch (error) {
    throw new Error(
      `Failed to initiate customer OTP login: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Verify OTP and issue JWT for customer
 */
export async function verifyCustomerOtp(
  data: CustomerVerifyOtpDto
): Promise<{ token: string; user: User }> {
  try {
    const otpRecord = await prisma.otp.findFirst({
      where: { email: data.email },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      throw new Error("Invalid or expired OTP");
    }

    const isValid = await bcrypt.compare(data.otp, otpRecord.otpHash);
    if (!isValid) {
      throw new Error("Invalid OTP");
    }

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user || user.role !== "CUSTOMER") {
      throw new Error("Customer not found");
    }

    await prisma.user.update({
      where: { email: data.email },
      data: { status: "ACTIVE" },
    });

    await prisma.otp.deleteMany({
      where: { email: data.email },
    });

    const token = jwt.sign(
      { userId: user.userId, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: JWT_EXPIRY }
    );

    return { token, user };
  } catch (error) {
    throw new Error(`Failed to verify customer OTP: ${getErrorMessage(error)}`);
  }
}
