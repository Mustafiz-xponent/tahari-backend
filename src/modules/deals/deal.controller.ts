import httpStatus from "http-status";
import { Request, Response } from "express";
import * as dealService from "@/modules/deals/deal.service";
import asyncHandler from "@/utils/asyncHandler";
import sendResponse from "@/utils/sendResponse";
import { Deal } from "@/generated/prisma/client";

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
