/**
 * Routes for category operations.
 * Defines API endpoints for categories.
 */

import { Router } from "express";
import * as CategoryController from "./category.controller";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

// Route to create a new category by admin
router.post("/", authMiddleware("ADMIN"), CategoryController.createCategory);

// Route to get all categories
router.get("/", CategoryController.getAllCategories);

// Route to get a category by ID
router.get("/:id", CategoryController.getCategoryById);

// Route to update a category's details by admin
router.put("/:id", authMiddleware("ADMIN"), CategoryController.updateCategory);

// Route to delete a category by admin
router.delete(
  "/:id",
  authMiddleware("ADMIN"),
  CategoryController.deleteCategory
);

export default router;
