import { Request, Response } from "express";
import * as promotionService from "@/modules/promotions/promotion.service";
import { Promotion } from "@/generated/prisma/client";
import asyncHandler from "@/utils/asyncHandler";
import httpStatus from "http-status";
import sendResponse from "@/utils/sendResponse";
import { GetAllPromotionsQueryDto } from "@/modules/promotions/promotion.dto";

/**
 * Create a new promotion
 * - Expects promotion data in `req.body`
 * - Expects `req.file` to accepts a file (e.g., image/banner)
 * - Calls service to create promotion and returns response
 */
export const createPromotion = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const data = req.body;
    const file = req.file;
    const promotion = await promotionService.createPromotion(data, file);

    sendResponse<Promotion>(res, {
      success: true,
      message: "Promotion created successfully",
      data: promotion,
      statusCode: httpStatus.CREATED,
    });
  }
);
/**
 * Get all promotions with pagination and filtering
 * - Accepts query params: page, limit, sort, placement, targetType
 * - Calls service to fetch paginated + filtered promotions
 */
export const getAllPromotions = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { page, limit, sort, placement, targetType } =
      req.query as unknown as GetAllPromotionsQueryDto;
    const skip = (page - 1) * limit;
    const paginationParams = { page, limit, skip, sort };
    const filterParams = { placement, targetType };

    const result = await promotionService.getAllPromotions(
      paginationParams,
      filterParams
    );

    sendResponse<Promotion[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Promotions retrieved successfully",
      data: result.data,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalCount,
        itemsPerPage: limit,
        hasNextPage: page < result.totalPages,
        hasPreviousPage: page > 1,
      },
    });
  }
);
/**
 * Get a single promotion by its ID
 * - Converts the string ID from URL param into BigInt
 * - Calls service to get promotion by ID
 */
export const getPromotionById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const promotionId = BigInt(req.params.id);
    const promotion = await promotionService.getPromotionById(promotionId);
    sendResponse<Promotion>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Promotion retrieved successfully",
      data: promotion,
    });
  }
);
/**
 * Update a promotion by ID
 * - Accepts updated data in body and optional file
 * - Converts the ID to BigInt
 * - Calls service to update promotion
 */
export const updatePromotion = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const promotionId = BigInt(req.params.id);
    const data = req.body;
    const file = req.file;
    const promotion = await promotionService.updatePromotion(
      promotionId,
      data,
      file
    );

    sendResponse<Promotion>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Promotion updated successfully",
      data: promotion,
    });
  }
);
/**
 * Delete a promotion by ID
 * - Converts ID to BigInt
 * - Calls service to delete promotion
 */
export const deletePromotion = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const promotionId = BigInt(req.params.id);
    await promotionService.deletePromotion(promotionId);
    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Promotion deleted successfully",
      data: null,
    });
  }
);
