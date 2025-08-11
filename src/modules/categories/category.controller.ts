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
import sendResponse from "@/utils/sendResponse";
import { Category } from "@/generated/prisma/client";
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
      sendResponse<Category>(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Category created successfully",
        data: category,
      });
    } catch (error) {
      handleErrorResponse(error, res, "create category");
    }
  },
];

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
    sendResponse<Category[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Categories retrieved successfully",
      data: categories,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch categories");
  }
};

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
      sendResponse<null>(res, {
        success: false,
        statusCode: httpStatus.NOT_FOUND,
        message: "Category not found",
        data: null,
      });
      return;
    }
    sendResponse<Category>(res, {
      success: true,
      statusCode: httpStatus.OK,
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
    const file = req.file;
    const updated = await categoryService.updateCategory(
      BigInt(categoryId),
      data,
      file
    );
    sendResponse<Category>(res, {
      success: true,
      statusCode: httpStatus.OK,
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
    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Category deleted successfully",
      data: null,
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete category");
  }
};
