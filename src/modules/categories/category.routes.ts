/**
 * Routes for category operations.
 * Defines API endpoints for categories.
 */

import { Router } from "express";
import * as CategoryController from "@/modules/categories/category.controller";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import { UserRole } from "@/generated/prisma/client";
import { upload } from "@/utils/fileUpload/configMulterUpload";

const router = Router();

// Route to create a new category by admin
router.post(
  "/",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CategoryController.createCategory
);

// Route to get all categories
router.get("/", CategoryController.getAllCategories);

// Route to get a category by ID
router.get("/:id", CategoryController.getCategoryById);

// Route to update a category's details by admin
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  upload.single("image"),
  CategoryController.updateCategory
);

// Route to delete a category by admin
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CategoryController.deleteCategory
);

export default router;
