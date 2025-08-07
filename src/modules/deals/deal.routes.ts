import { Router } from "express";
import * as dealController from "@/modules/deals/deal.controller";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import validator from "@/middlewares/validator";
import { UserRole } from "@/generated/prisma/client";
import {
  zCreateDealDto,
  zDeleteDealDto,
  zGetAllDealsDto,
  zGetDealDto,
  zUpdateDealDto,
} from "@/modules/deals/deal.dto";

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

// Route to get a deal by ID
router.get("/:id", validator(zGetDealDto), dealController.getDealById);

// Route to update a deal's details
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validator(zUpdateDealDto),
  dealController.updateDeal
);

// Route to delete a promotion
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validator(zDeleteDealDto),
  dealController.deleteDeal
);

export default router;
