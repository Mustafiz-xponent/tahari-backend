// src/modules/farmers/farmers.controller.ts
import { Request, Response } from "express";
import * as farmerService from "./farmers.service";
import { zCreateFarmerDto, zUpdateFarmerDto } from "./farmer.dto";
import { ZodError, z } from "zod";

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
    res.status(201).json({ message: "Farmer created successfully", farmer });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error creating farmer:", error);
    res.status(500).json({ message: "Failed to create farmer" });
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
    res.json(farmers);
  } catch (error) {
    console.error("Error fetching farmers:", error);
    res.status(500).json({ message: "Failed to fetch farmers" });
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
      res.status(404).json({ message: "Farmer not found" });
      return;
    }
    res.json(farmer);
  } catch (error) {
    console.error("Error fetching farmer:", error);
    res.status(500).json({ message: "Failed to fetch farmer" });
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
    res.json({ message: "Farmer updated successfully", farmer: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error updating farmer:", error);
    res.status(500).json({ message: "Failed to update farmer" });
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
    res.json({ message: "Farmer deleted successfully" });
  } catch (error) {
    console.error("Error deleting farmer:", error);
    res.status(500).json({ message: "Failed to delete farmer" });
  }
};
