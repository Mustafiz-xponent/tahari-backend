/**
 * Controller layer for Admin authentication operations.
 * Handles HTTP requests and responses for admin authentication endpoints.
 */
import { Request, Response } from "express";
import { handleErrorResponse } from "@/utils/errorResponseHandler";
import {
  zAdminLoginDto,
  zCreateAdminDto,
} from "@/modules/auth/admin/admin.dto";
import * as adminService from "@/modules/auth/admin/admin.service";
import { z } from "zod";
import httpStatus from "http-status";
import sendResponse from "@/utils/sendResponse";
import { User } from "@/generated/prisma/client";

const adminIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Admin ID must be a positive integer",
});

/**
 * Create admin by super admin only
 */
export const createAdmin = async (req: Request, res: Response) => {
  try {
    const data = zCreateAdminDto.parse(req.body);
    const { user } = await adminService.createAdmin(data);
    sendResponse<{ user: Omit<User, "passwordHash"> }>(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Admin created successfully",
      data: { user },
    });
  } catch (error) {
    handleErrorResponse(error, res, "create admin");
  }
};

/**
 * login admin/superadmin through email/phone with password.
 */
export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const data = zAdminLoginDto.parse(req.body);
    const { token, user } = await adminService.loginAdmin(data);
    sendResponse<{ token: string; user: Omit<User, "passwordHash"> }>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admin logged in successfully",
      data: { token, user },
    });
  } catch (error) {
    handleErrorResponse(error, res, "login admin");
  }
};

/**
 * Delete an admin by ID
 */
export const deleteAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminId = adminIdSchema.parse(req.params.id);
    await adminService.deleteAdmin(adminId, req.user?.userId);
    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admin deleted successfully",
      data: null,
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete admin");
  }
};
