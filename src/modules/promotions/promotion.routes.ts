import { Router } from "express";
import * as promotionController from "@/modules/promotions/promotion.controller";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import validator from "@/middlewares/validator";
import {
  zCreatePromotionDto,
  zDeletePromotionDto,
  zGetAllPromotionsDto,
  zGetPromotionDto,
  zUpdatePromotionDto,
} from "@/modules/promotions/promotion.dto";
import { upload } from "@/utils/fileUpload/configMulterUpload";

const router = Router();

// Route to create a new promotion
router.post(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  upload.single("image"),
  validator(zCreatePromotionDto),
  promotionController.createPromotion
);

// Route to get all promotions
router.get(
  "/",
  validator(zGetAllPromotionsDto),
  promotionController.getAllPromotions
);

// Route to get a promotion by ID
router.get(
  "/:id",
  validator(zGetPromotionDto),
  promotionController.getPromotionById
);

// Route to update a promotion's details
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  upload.single("image"),
  validator(zUpdatePromotionDto),
  promotionController.updatePromotion
);

// Route to delete a promotion
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  validator(zDeletePromotionDto),
  promotionController.deletePromotion
);

export default router;
