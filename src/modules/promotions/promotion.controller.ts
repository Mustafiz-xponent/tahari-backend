import { Request, Response } from "express";
import * as promotionService from "@/modules/promotions/promotion.service";
import {
  PromoPlacement,
  PromoTargetType,
  Promotion,
} from "@/generated/prisma/client";
import asyncHandler from "@/utils/asyncHandler";
import httpStatus from "http-status";
import sendResponse from "@/utils/sendResponse";

interface IPromotionsQuery {
  page?: string;
  limit?: string;
  sort?: string;
  placement?: PromoPlacement;
  targetType?: PromoTargetType;
}

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

export const getAllPromotions = asyncHandler(
  async (
    req: Request<{}, {}, {}, IPromotionsQuery>,
    res: Response
  ): Promise<void> => {
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
    sendResponse<Promotion[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
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
  }
);

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
