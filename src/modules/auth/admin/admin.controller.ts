/**
 * Controller layer for Admin authentication operations.
 * Handles HTTP requests and responses for admin authentication endpoints.
 */

import { Request, Response } from "express";
import * as adminService from "./admin.service";
import { zCreateAdminDto, zAdminLoginDto } from "./admin.dto";
import { ZodError } from "zod";

/**
 * Create a new admin (super admin only)
 */
export const createAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCreateAdminDto.parse(req.body);
    await adminService.createAdmin(data);
    res.status(201).json({ message: "Admin created successfully" });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error creating admin:", error);
    res.status(500).json({ message: "Failed to create admin" });
  }
};

/**
 * Login an admin with email/password
 */
export const loginAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zAdminLoginDto.parse(req.body);
    const { token, user } = await adminService.loginAdmin(data);
    res.json({ message: "Admin logged in successfully", token, user });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error logging in admin:", error);
    res.status(500).json({ message: "Failed to login admin" });
  }
};
