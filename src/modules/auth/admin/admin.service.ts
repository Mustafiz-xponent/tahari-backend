/**
 * Service layer for Admin authentication operations.
 * Handles admin creation by super admins and login.
 */
import bcrypt from "bcrypt";
import { User } from "../../../../generated/prisma/client";
import prisma from "../../../prisma-client/prismaClient";
import { generateAuthToken } from "../../../utils/authToken";
import { getErrorMessage } from "../../../utils/errorHandler";
import { AdminLoginDto, CreateAdminDto } from "./admin.dto";

const SALT_ROUNDS = 10;

/**
 * Create admin by super admin only
 */
export async function createAdmin(
  data: CreateAdminDto
): Promise<{ user: Omit<User, "passwordHash"> }> {
  try {
    // Check if email or phone already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }],
      },
    });

    if (existingUser) {
      throw new Error(
        existingUser.email === data.email
          ? "Email already registered"
          : "Phone number already registered"
      );
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        name: data.name,
        address: data.address,
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
        admin: { create: {} },
      },
    });

    const { passwordHash: _, ...userData } = user;
    return { user: userData };
  } catch (error) {
    throw new Error(`Failed to create admin: ${getErrorMessage(error)}`);
  }
}

/**
 * login admin/superadmin through email/phone with password.
 */
export async function loginAdmin(
  data: AdminLoginDto
): Promise<{ token: string; user: User }> {
  try {
    // Validate input
    if (!data.password) throw new Error("Password is required");
    if (!data.email && !data.phone) {
      throw new Error("Email or phone is required");
    }

    // Determine identifier
    const identifier = data.email
      ? { email: data.email }
      : { phone: data.phone! };

    // Find user
    const user = await prisma.user.findUnique({
      where: identifier,
      include: { admin: true },
    });

    // Validate user
    if (!user) throw new Error("Invalid credentials");
    if (!user.passwordHash) throw new Error("Password not set yet");
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) throw new Error("Invalid credentials");

    // Generate token
    return generateAuthToken(user);
  } catch (error) {
    throw new Error(`Failed to login admin: ${getErrorMessage(error)}`);
  }
}
