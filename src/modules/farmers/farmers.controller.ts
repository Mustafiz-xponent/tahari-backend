// src/modules/farmers/farmers.controller.ts
import { Request, Response } from "express";
import * as farmerService from "@/modules/farmers/farmers.service";
import {
  zCreateFarmerDto,
  zUpdateFarmerDto,
} from "@/modules/farmers/farmer.dto";
import { ZodError, z } from "zod";
import httpStatus from "http-status";
import sendResponse from "@/utils/sendResponse";
import { Farmer } from "@/generated/prisma/client";

const farmerIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Farmer ID must be a positive integer",
});

/**
 * Create a new farmer
 */
export const createFarmer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCreateFarmerDto.parse(req.body);
    const farmer = await farmerService.createFarmer(data);
    sendResponse<Farmer>(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Farmer created successfully",
      data: farmer,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(httpStatus.BAD_REQUEST).json({ errors: error.flatten() });
      return;
    }
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to create farmer",
      data: null,
    });
  }
};

/**
 * Get all farmers
 */
export const getAllFarmers = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const farmers = await farmerService.getAllFarmers();
    sendResponse<Farmer[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Farmers retrieved successfully",
      data: farmers,
    });
  } catch (error) {
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch farmers",
      data: null,
    });
  }
};

/**
 * Get a single farmer by ID
 */
export const getFarmerById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const farmerId = BigInt(req.params.id);
    const farmer = await farmerService.getFarmerById(farmerId);
    if (!farmer) {
      res.status(httpStatus.NOT_FOUND).json({ message: "Farmer not found" });
      return;
    }
    sendResponse<Farmer>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Farmer retrieved successfully",
      data: farmer,
    });
  } catch (error) {
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch farmer",
      data: null,
    });
  }
};

/**
 * Update a farmer by ID
 */
export const updateFarmer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const farmerId = farmerIdSchema.parse(req.params.id);
    const data = zUpdateFarmerDto.parse(req.body);
    const updated = await farmerService.updateFarmer(farmerId, data);
    sendResponse<Farmer>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Farmer updated successfully",
      data: updated,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(httpStatus.BAD_REQUEST).json({ errors: error.flatten() });
      return;
    }
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to update farmer",
      data: null,
    });
  }
};

/**
 * Delete a farmer by ID
 */
export const deleteFarmer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const farmerId = farmerIdSchema.parse(req.params.id);
    await farmerService.deleteFarmer(farmerId);
    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Farmer deleted successfully",
      data: null,
    });
  } catch (error) {
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to delete farmer",
      data: null,
    });
  }
};
