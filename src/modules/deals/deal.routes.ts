import { Router } from "express";
import * as dealController from "@/modules/deals/deal.controller";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import validator from "@/middlewares/validator";
import { UserRole } from "@/generated/prisma/client";
import { zCreateDealDto, zGetAllDealsDto } from "@/modules/deals/deal.dto";

const router = Router();

// Route to create a new deal
router.post(
  "/",
  authMiddleware,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validator(zCreateDealDto),
  dealController.createDeal
);

// Route to get all deals
router.get(
  "/",
  authMiddleware,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validator(zGetAllDealsDto),
  dealController.getAllDeals
);

export default router;
