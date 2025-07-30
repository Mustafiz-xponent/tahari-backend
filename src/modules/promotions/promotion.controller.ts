/**
 * Controller layer for Promotions entity operations.
 * Handles HTTP requests and responses for promotion-related endpoints.
 */

import { Request, Response } from "express";
import * as promotionService from "@/modules/promotions/promotion.service";
import { handleErrorResponse } from "@/utils/errorResponseHandler";
import httpStatus from "http-status";
import { Promotion } from "@/generated/prisma/client";

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
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const promotion = await promotionService.getAllPromotions(req.body);
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
 * Get promotion by its ID
 */
export const getPromotionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const promotion = await promotionService.getPromotionById(req.body);
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
