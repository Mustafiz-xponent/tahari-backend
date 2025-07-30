/**
 * Routes for promotion entity operations.
 * Defines API endpoints for promotion related CRUD operations.
 */

import { Router } from "express";
import * as promotionController from "@/modules/promotions/promotion.controller";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import validator from "@/middlewares/validator";
import { zCreatePromotionDto } from "@/modules/promotions/promotion.dto";
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
router.get("/", promotionController.getAllPromotions);

// Route to get a promotion by ID
router.get("/:id", promotionController.getPromotionById);

// Route to update a promotion's details
router.put("/:id", promotionController.updatePromotion);

// Route to delete a promotion
router.delete("/:id", promotionController.deletePromotion);

export default router;
