import { Request, Response } from "express";
import * as FarmerService from "./farmer.service";

// Create a new farmer
export const createFarmer = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const farmer = await FarmerService.createFarmer(req.body);
    return res.status(201).json(farmer);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all farmers
export const getAllFarmers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const farmers = await FarmerService.getAllFarmers();
    return res.status(200).json(farmers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get a farmer by ID
export const getFarmerById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const farmerId = BigInt(req.params.id); // Assuming ID is passed as a string, convert to BigInt
    const farmer = await FarmerService.getFarmerById(farmerId);
    if (farmer) {
      return res.status(200).json(farmer);
    } else {
      return res.status(404).json({ message: "Farmer not found." });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Update a farmer's details
export const updateFarmer = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const farmerId = BigInt(req.params.id); // Assuming ID is passed as a string, convert to BigInt
    const updatedFarmer = await FarmerService.updateFarmer(farmerId, req.body);
    return res.status(200).json(updatedFarmer);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Delete a farmer
export const deleteFarmer = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const farmerId = BigInt(req.params.id); // Assuming ID is passed as a string, convert to BigInt
    const deletedFarmer = await FarmerService.deleteFarmer(farmerId);
    return res.status(200).json(deletedFarmer);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
