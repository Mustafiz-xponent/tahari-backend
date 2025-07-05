/**
 * Controller layer for category operations.
 * Handles HTTP requests and responses for category endpoints.
 */

import { Request, Response } from "express";
import * as categoryService from "@/modules/categories/category.service";
import {
  zCreateCategoryDto,
  zUpdateCategoryDto,
} from "@/modules/categories/category.dto";
import { handleErrorResponse } from "@/utils/errorResponseHandler";
import { z } from "zod";
import { upload } from "@/utils/fileUpload/configMulterUpload";
import httpStatus from "http-status";
const categoryIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Category ID must be a positive integer",
});

/**
 * Create a new category
 */
export const createCategory = [
  upload.single("image"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = zCreateCategoryDto.parse(req.body);
      const file = req.file;

      const category = await categoryService.createCategory({
        data,
        file,
      });
      res.status(httpStatus.CREATED).json({
        success: true,
        message: "Category created successfully",
        data: category,
      });
    } catch (error) {
      handleErrorResponse(error, res, "create category");
    }
  },
];

// /**
//  * Get all categories
//  */
// export const getAllCategories = async (
//   _req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const categories = await categoryService.getAllCategories();
//     res.json({
//       success: true,
//       message: "Categories retrieved successfully",
//       data: categories,
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "fetch categories");
//   }
// };

/**
 * Get all categories with accessible image URLs for products
 */
export const getAllCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const generateAccessibleUrls = req.query.generateAccessibleUrls !== "false"; // Default to true
    const urlExpiresIn = parseInt(req.query.urlExpiresIn as string) || 300; // Default 5 minutes

    const categories = await categoryService.getAllCategories(
      generateAccessibleUrls,
      urlExpiresIn
    );

    res.json({
      success: true,
      message: "Categories retrieved successfully",
      data: categories,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch categories");
  }
};

// /**
//  * Get a single category by ID
//  */
// export const getCategoryById = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const categoryId = BigInt(req.params.id);
//     const category = await categoryService.getCategoryById(categoryId);
//     if (!category) {
//       throw new Error("Category not found.");
//     }
//     res.json({
//       success: true,
//       message: "Category retrieved successfully",
//       data: category,
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "fetch category");
//   }
// };

/**
 * Get a single category by ID with accessible image URLs for products
 */
export const getCategoryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categoryId = BigInt(req.params.id);
    const generateAccessibleUrls = req.query.generateAccessibleUrls !== "false"; // Default to true
    const urlExpiresIn = parseInt(req.query.urlExpiresIn as string) || 300; // Default 5 minutes

    const category = await categoryService.getCategoryById(
      categoryId,
      generateAccessibleUrls,
      urlExpiresIn
    );

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "Category retrieved successfully",
      data: category,
    });
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
    res.json({
      success: true,
      message: "Category updated successfully",
      data: updated,
    });
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
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    handleErrorResponse(error, res, "delete category");
  }
};
