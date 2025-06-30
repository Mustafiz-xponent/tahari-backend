/**
 * Routes for Admin authentication operations.
 * Defines API endpoints for admin authentication.
 */

import { Router } from "express";
import { authMiddleware, authorizeRoles } from "../../../middlewares/auth";
import * as AdminController from "./admin.controller";

const router = Router();

// Route to create a new admin (super admin only)
router.post(
  "/create",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  AdminController.createAdmin
);

// Route to login an admin with phone/email and password
router.post("/login", AdminController.loginAdmin);

// Route to delete an admin by superadmin
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  AdminController.deleteAdmin
);

export default router;
