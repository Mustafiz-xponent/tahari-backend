/**
 * Controller layer for Promotions entity operations.
 * Handles HTTP requests and responses for promotion-related endpoints.
 */

import { Request, Response } from "express";
import * as promotionService from "@/modules/promotions/promotion.service";
import { handleErrorResponse } from "@/utils/errorResponseHandler";
import httpStatus from "http-status";
import { PromoPlacement, PromoTargetType } from "@/generated/prisma/client";

interface IPromotionsQuery {
  page?: string;
  limit?: string;
  sort?: string;
  placement?: PromoPlacement;
  targetType?: PromoTargetType;
}

/**
 * Create a new promotion
 */
export const createPromotion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = req.body;
    const file = req.file;
    const promotion = await promotionService.createPromotion(data, file);
    res.status(httpStatus.CREATED).json({
      success: true,
      message: "Promotion created successfully",
      data: promotion,
    });
  } catch (error) {
    handleErrorResponse(error, res, "create promotion");
  }
};

/**
 * Get all promotions
 */
export const getAllPromotions = async (
  req: Request<{}, {}, {}, IPromotionsQuery>,
  res: Response
): Promise<void> => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit as string) || 10, 1),
      100
    ); // Max 100 items per page
    const skip = (page - 1) * limit;
    const sort = req.query.sort === "asc" ? "asc" : "desc";
    const placement = req.query.placement as PromoPlacement;
    const targetType = req.query.targetType as PromoTargetType;

    const paginationParams = { page, limit, skip, sort };
    const filterParams = { placement, targetType };

    const result = await promotionService.getAllPromotions(
      paginationParams,
      filterParams
    );
    res.status(httpStatus.OK).json({
      success: true,
      message: "Promotions retrieved successfully",
      data: result.promotions,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalCount,
        itemsPerPage: limit,
        hasNextPage: page < result.totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    handleErrorResponse(error, res, "retrive promotion");
  }
};

/**
 * Get promotion by its ID
 */
export const getPromotionById = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const promotionId = BigInt(req.params.id);
    const promotion = await promotionService.getPromotionById(promotionId);
    res.status(httpStatus.CREATED).json({
      success: true,
      message: "Promotion retrieved successfully",
      data: promotion,
    });
  } catch (error) {
    handleErrorResponse(error, res, "retrive promotion");
  }
};

/**
 * Update promotion
 */
export const updatePromotion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const promotion = await promotionService.updatePromotion(req.body);
    res.status(httpStatus.CREATED).json({
      success: true,
      message: "Promotion updated successfully",
      data: promotion,
    });
  } catch (error) {
    handleErrorResponse(error, res, "update promotion");
  }
};

/**
 * Delete promotion
 */
export const deletePromotion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const promotion = await promotionService.deletePromotion(req.body);
    res.status(httpStatus.CREATED).json({
      success: true,
      message: "Promotion deleted successfully",
      data: promotion,
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete promotion");
  }
};
