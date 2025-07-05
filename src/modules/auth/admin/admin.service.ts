/**
 * Service layer for Admin authentication operations.
 * Handles admin creation by super admins and login.
 */
import bcrypt from "bcrypt";
import { User } from "@/generated/prisma/client";
import prisma from "@/prisma-client/prismaClient";
import { generateAuthToken } from "@/utils/authToken";
import { getErrorMessage } from "@/utils/errorHandler";
import { AdminLoginDto, CreateAdminDto } from "@/modules/auth/admin/admin.dto";

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
        address: data.address || [],
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

/**
 * Delete an admin by ID
 * @param adminId The ID of the admin to delete
 * @param requestingUserId The ID of the superadmin making the request
 * @throws Error if admin not found or if trying to delete self
 */
export const deleteAdmin = async (
  adminId: bigint,
  requestingUserId?: string
): Promise<User> => {
  try {
    // Prevent self-deletion
    if (requestingUserId && BigInt(requestingUserId) === adminId) {
      throw new Error("Superadmin cannot delete themselves");
    }

    return await prisma.$transaction(async (prisma) => {
      // Verify admin exists and is not a superadmin
      const adminToDelete = await prisma.user.findUnique({
        where: { userId: Number(adminId) },
        include: { admin: true },
      });

      if (!adminToDelete) {
        throw new Error("Admin not found");
      }

      if (adminToDelete.role === "SUPER_ADMIN") {
        throw new Error("Cannot delete a superadmin");
      }

      // Delete the admin record first if it exists
      if (adminToDelete.admin) {
        await prisma.admin.delete({
          where: { userId: Number(adminId) },
        });
      }

      // Then delete the user
      return await prisma.user.delete({
        where: { userId: Number(adminId) },
      });
    });
  } catch (error) {
    throw new Error(`Error deleting admin: ${getErrorMessage(error)}`);
  }
};
