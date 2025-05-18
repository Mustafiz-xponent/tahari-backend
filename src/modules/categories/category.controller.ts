/**
 * Controller layer for category operations.
 * Handles HTTP requests and responses for category endpoints.
 */

import { Request, Response } from "express";
import * as categoryService from "./category.service";
import { zCreateCategoryDto, zUpdateCategoryDto } from "./category.dto";
import { handleErrorResponse } from "../../utils/errorResponseHandler";
import { z } from "zod";

const categoryIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Category ID must be a positive integer",
});

/**
 * Create a new category
 */
export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCreateCategoryDto.parse(req.body);
    const category = await categoryService.createCategory(data);
    res
      .status(201)
      .json({ message: "Category created successfully", category });
  } catch (error) {
    handleErrorResponse(error, res, "create category");
  }
};

/**
 * Get all categories
 */
export const getAllCategories = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await categoryService.getAllCategories();
    res.json(categories);
  } catch (error) {
    handleErrorResponse(error, res, "fetch categories");
  }
};

/**
 * Get a single category by ID
 */
export const getCategoryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categoryId = BigInt(req.params.id);
    const category = await categoryService.getCategoryById(categoryId);
    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }
    res.json(category);
  } catch (error) {
    handleErrorResponse(error, res, "fetch category");
  }
};

/**
 * Update a category by ID
 */
export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categoryId = categoryIdSchema.parse(req.params.id);
    const data = zUpdateCategoryDto.parse(req.body);
    const updated = await categoryService.updateCategory(categoryId, data);
    res.json({ message: "Category updated successfully", category: updated });
  } catch (error) {
    handleErrorResponse(error, res, "update category");
  }
};

/**
 * Delete a category by ID
 */
export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categoryId = categoryIdSchema.parse(req.params.id);
    await categoryService.deleteCategory(categoryId);
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    handleErrorResponse(error, res, "delete category");
  }
};
