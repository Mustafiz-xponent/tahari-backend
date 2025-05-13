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
// import { getErrorMessage } from "@/utils/errorHandler";
import { getErrorMessage } from "../../../utils/errorHandler";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import axios from "axios";

const OTP_EXPIRY_MINUTES = 5;
const JWT_EXPIRY = "1d";
const SALT_ROUNDS = 10;

/**
 * Register a new customer
 */
// export async function registerCustomer(
//   data: CustomerRegisterDto
// ): Promise<void> {
//   try {
//     const existingUser = await prisma.user.findUnique({
//       where: { email: data.email },
//     });
//     if (existingUser) {
//       throw new Error("Email already registered");
//     }

//     const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

//     const user = await prisma.user.create({
//       data: {
//         email: data.email,
//         name: data.name,
//         phone: data.phone,
//         address: data.address,
//         passwordHash,
//         role: "CUSTOMER",
//         status: data.phone ? "PENDING" : "ACTIVE",
//         customer: { create: {} },
//       },
//     });

//     if (data.phone) {
//       // Validate SMS configuration first
//       // if (
//       //   !process.env.SMS_API_URL ||
//       //   !process.env.SMS_API_KEY ||
//       //   !process.env.SMS_SENDER_ID
//       // ) {
//       //   console.warn("⚠ SMS configuration missing. OTP will not be sent.");
//       //   return;
//       // }

//       const otp = Math.floor(100000 + Math.random() * 900000).toString();
//       console.log(`Generated OTP for ${data.email}: ${otp}`);

//       const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
//       const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

//       await prisma.otp.create({
//         data: {
//           email: data.email,
//           otpHash,
//           expiresAt,
//         },
//       });

//       // TODO: need to update payload variable as per documentation
//       const smsPayload = {
//         api_key: process.env.SMS_API_KEY,
//         sender_id: process.env.SMS_SENDER_ID,
//         number: data.phone,
//         message: `Your OTP for registration is ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
//       };

//       await axios.post(process.env.SMS_API_URL!, smsPayload);
//     }
//   } catch (error) {
//     throw new Error(`Failed to register customer: ${getErrorMessage(error)}`);
//   }
// }

export async function registerCustomer(
  data: CustomerRegisterDto
): Promise<void> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create user
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

    // Send OTP if phone number provided
    if (data.phone) {
      // Validate SMS configuration
      if (!process.env.SMS_API_URL || !process.env.SMS_API_KEY) {
        console.warn("⚠ SMS configuration missing. OTP will not be sent.");
        return;
      }

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`OTP for ${data.email}:`, otp);

      // Store hashed OTP
      const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      await prisma.otp.create({
        data: {
          email: data.email,
          otpHash,
          expiresAt,
        },
      });

      // Prepare SMS payload
      const smsPayload = new URLSearchParams();
      smsPayload.append("api_key", process.env.SMS_API_KEY);
      smsPayload.append("to", data.phone);
      smsPayload.append(
        "msg",
        `Your registration OTP is ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`
      );

      // Add sender ID if configured
      if (process.env.SMS_SENDER_ID) {
        smsPayload.append("sender_id", process.env.SMS_SENDER_ID);
      }

      // Send SMS
      const response = await axios.post(
        process.env.SMS_API_URL,
        smsPayload.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      // Check SMS API response
      if (response.data?.error !== 0) {
        console.error("SMS API Error:", response.data);
        throw new Error(
          `Failed to send SMS: ${response.data?.msg || "Unknown error"}`
        );
      }

      console.log("SMS sent successfully:", response.data);
    }
  } catch (error) {
    console.error("Customer registration error:", error);
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
// export async function otpLoginCustomer(
//   data: CustomerOtpLoginDto
// ): Promise<void> {
//   try {
//     const user = await prisma.user.findUnique({
//       where: { email: data.email },
//     });
//     if (!user || user.role !== "CUSTOMER") {
//       throw new Error("Customer not found");
//     }
//     if (user.phone !== data.phone) {
//       throw new Error("Phone number does not match registered phone");
//     }

//     // Validate SMS configuration first
//     // if (
//     //   !process.env.SMS_API_URL ||
//     //   !process.env.SMS_API_KEY ||
//     //   !process.env.SMS_SENDER_ID
//     // ) {
//     //   console.warn("⚠ SMS configuration missing. OTP will not be sent.");
//     //   return;
//     // }

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     console.log(`OTP for ${data.phone}:`, otp);
//     const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
//     const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

//     await prisma.otp.create({
//       data: {
//         email: data.email,
//         otpHash,
//         expiresAt,
//       },
//     });

//     // const smsPayload = {
//     //   api_key: process.env.SMS_API_KEY,
//     //   sender_id: process.env.SMS_SENDER_ID,
//     //   number: data.phone,
//     //   message: `Your login OTP is ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
//     // };

//     const smsPayload = {
//       api_key: process.env.SMS_API_KEY,
//       sender_id: process.env.SMS_SENDER_ID, // optional
//       to: data.phone,
//       msg: `Your login OTP is ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
//     };

//     await axios.post(process.env.SMS_API_URL!, smsPayload);
//   } catch (error) {
//     throw new Error(
//       `Failed to initiate customer OTP login: ${getErrorMessage(error)}`
//     );
//   }
// }

export async function otpLoginCustomer(
  data: CustomerOtpLoginDto
): Promise<void> {
  try {
    // Validate user exists and is a customer
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user || user.role !== "CUSTOMER") {
      throw new Error("Customer not found");
    }
    if (user.phone !== data.phone) {
      throw new Error("Phone number does not match registered phone");
    }

    // Validate SMS configuration
    if (!process.env.SMS_API_URL || !process.env.SMS_API_KEY) {
      throw new Error("SMS service configuration is incomplete");
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`OTP for ${data.phone}:`, otp); // For development debugging

    // Store hashed OTP
    const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.otp.create({
      data: {
        email: data.email,
        otpHash,
        expiresAt,
      },
    });

    // Prepare SMS payload
    const smsPayload = new URLSearchParams();
    smsPayload.append("api_key", process.env.SMS_API_KEY);
    smsPayload.append("to", data.phone);
    smsPayload.append(
      "msg",
      `Your login OTP is ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`
    );

    // Add sender ID if configured
    if (process.env.SMS_SENDER_ID) {
      smsPayload.append("sender_id", process.env.SMS_SENDER_ID);
    }

    // Send SMS
    const response = await axios.post(
      process.env.SMS_API_URL,
      smsPayload.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Check SMS API response
    if (response.data?.error !== 0) {
      // 0 means success in Alpha SMS API
      console.error("SMS API Error:", response.data);
      throw new Error(
        `Failed to send SMS: ${response.data?.msg || "Unknown error"}`
      );
    }

    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("OTP login error:", error);
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
