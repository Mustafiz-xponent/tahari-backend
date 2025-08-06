import { Request, Response } from "express";
import * as promotionService from "@/modules/promotions/promotion.service";
import { Promotion } from "@/generated/prisma/client";
import asyncHandler from "@/utils/asyncHandler";
import httpStatus from "http-status";
import sendResponse from "@/utils/sendResponse";
import { GetAllPromotionsQueryDto } from "./promotion.dto";

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
