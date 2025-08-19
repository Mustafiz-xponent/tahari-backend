import { Router } from "express";
import { getDashboardSummary } from "./dashboard.controller";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import { UserRole } from "@/generated/prisma/client";

const router = Router();
router.get(
  "/summary",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  getDashboardSummary
);
export default router;
