import { Router } from "express";
import * as dealController from "@/modules/promotions/promotion.controller";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import validator from "@/middlewares/validator";
import { UserRole } from "@/generated/prisma/client";

const router = Router();

router.post(
  "/",
  authMiddleware,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  //   dealController.createDeal
);

export default router;
