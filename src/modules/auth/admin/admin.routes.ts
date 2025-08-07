/**
 * Routes for Admin authentication operations.
 * Defines API endpoints for admin authentication.
 */

import { Router } from "express";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import * as AdminController from "@/modules/auth/admin/admin.controller";
import { UserRole } from "@/generated/prisma/client";

const router = Router();

// Route to create a new admin (super admin only)
router.post(
  "/create",
  authMiddleware,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AdminController.createAdmin
);

// Route to login an admin with phone/email and password
router.post("/login", AdminController.loginAdmin);

// Route to delete an admin by superadmin
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AdminController.deleteAdmin
);

export default router;
