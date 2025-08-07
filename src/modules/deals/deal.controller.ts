import httpStatus from "http-status";
import { Request, Response } from "express";
import * as dealService from "@/modules/deals/deal.service";
import asyncHandler from "@/utils/asyncHandler";
import sendResponse from "@/utils/sendResponse";
import { Deal } from "@/generated/prisma/client";
import { GetAllDealsQueryDto } from "@/modules/deals/deal.dto";

/**
 * Create a new deal
 * - Expects deal data in `req.body`
 * - Calls service to create deal and returns response
 */
export const createDeal = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const data = req.body;
    const deal = await dealService.createDeal(data);

    sendResponse<Deal>(res, {
      success: true,
      message: "Deal created successfully",
      data: deal,
      statusCode: httpStatus.CREATED,
    });
  }
);
/**
 * Get all deals with pagination and filtering
 * - Accepts query params: page, limit, sort
 * - Calls service to fetch paginated + filtered promotions
 */
export const getAllDeals = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { page, limit, sort, isActive } =
      req.query as unknown as GetAllDealsQueryDto;
    const skip = (page - 1) * limit;
    const paginationParams = { page, limit, skip, sort };
    const filterParams = { isActive };

    const result = await dealService.getAllDeals(
      paginationParams,
      filterParams
    );

    sendResponse<Deal[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Deals retrieved successfully",
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
