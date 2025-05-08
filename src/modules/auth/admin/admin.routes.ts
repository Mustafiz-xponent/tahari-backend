/**
 * Routes for Admin authentication operations.
 * Defines API endpoints for admin authentication.
 */

import { Router } from "express";
import * as AdminController from "./admin.controller";
import { authMiddleware } from "@/middlewares/auth";

const router = Router();

// Route to create a new admin (super admin only)
router.post(
  "/create",
  authMiddleware("SUPER_ADMIN"),
  AdminController.createAdmin
);

// Route to login an admin with email/password
router.post("/login", AdminController.loginAdmin);

export default router;
