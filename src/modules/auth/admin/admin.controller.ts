/**
 * Controller layer for Admin authentication operations.
 * Handles HTTP requests and responses for admin authentication endpoints.
 */
import { Request, Response } from "express";
import { handleErrorResponse } from "../../../utils/errorResponseHandler";
import { zAdminLoginDto, zCreateAdminDto } from "./admin.dto";
import * as adminService from "./admin.service";
import { z } from "zod";

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
    res.status(201).json({ 
      success: true,
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
    res.json({
      success: true,
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

    res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete admin");
  }
};
