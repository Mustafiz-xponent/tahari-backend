/**
 * Service layer for Admin authentication operations.
 * Handles admin creation by super admins and login.
 */

import prisma from "../../../prisma-client/prismaClient";
import { User } from "../../../../generated/prisma/client";
import { CreateAdminDto, AdminLoginDto } from "./admin.dto";
import { getErrorMessage } from "@/utils/errorHandler";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_EXPIRY = "1h";
const SALT_ROUNDS = 10;

/**
 * Create a new admin (super admin only)
 */
export async function createAdmin(data: CreateAdminDto): Promise<void> {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new Error("Email already registered");
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        address: data.address,
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
        admin: { create: {} },
      },
    });
  } catch (error) {
    throw new Error(`Failed to create admin: ${getErrorMessage(error)}`);
  }
}

/**
 * Login admin with email and password
 */
export async function loginAdmin(
  data: AdminLoginDto
): Promise<{ token: string; user: User }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user || user.role !== "ADMIN") {
      throw new Error("Admin not found");
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
    throw new Error(`Failed to login admin: ${getErrorMessage(error)}`);
  }
}
