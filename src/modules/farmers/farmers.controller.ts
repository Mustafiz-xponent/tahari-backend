// src/modules/farmers/farmers.controller.ts

import { Request, Response } from "express";
import * as FarmerService from "./farmers.service";
import { getErrorMessage } from "@/utils/errorHandler";

// Create a new farmer
const createFarmer = async (req: Request, res: Response): Promise<void> => {
  try {
    const farmer = await FarmerService.createFarmer(req.body);
    res.status(201).json(farmer); // No return
  } catch (error) {
    res.status(500).json({ message: getErrorMessage(error) }); // No return
  }
};

// Get all farmers
const getAllFarmers = async (req: Request, res: Response): Promise<void> => {
  try {
    const farmers = await FarmerService.getAllFarmers();
    res.status(200).json(farmers); // No return
  } catch (error) {
    res.status(500).json({ message: getErrorMessage(error) }); // No return
  }
};

// Get a farmer by ID
const getFarmerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) {
      res.status(400).json({ message: "Invalid farmer ID" }); // No return
      return;
    }
    const farmerId = BigInt(id);
    const farmer = await FarmerService.getFarmerById(farmerId);
    if (farmer) {
      res.status(200).json(farmer); // No return
    } else {
      res.status(404).json({ message: "Farmer not found." }); // No return
    }
  } catch (error) {
    res.status(500).json({ message: getErrorMessage(error) }); // No return
  }
};

// Update a farmer's details
const updateFarmer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) {
      res.status(400).json({ message: "Invalid farmer ID" }); // No return
      return;
    }
    const farmerId = BigInt(id);
    const updatedFarmer = await FarmerService.updateFarmer(farmerId, req.body);
    res.status(200).json(updatedFarmer); // No return
  } catch (error) {
    res.status(500).json({ message: getErrorMessage(error) }); // No return
  }
};

// Delete a farmer
const deleteFarmer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) {
      res.status(400).json({ message: "Invalid farmer ID" }); // No return
      return;
    }
    const farmerId = BigInt(id);
    const deletedFarmer = await FarmerService.deleteFarmer(farmerId);
    res.status(200).json(deletedFarmer); // No return
  } catch (error) {
    res.status(500).json({ message: getErrorMessage(error) }); // No return
  }
};

export default {
  createFarmer,
  getAllFarmers,
  getFarmerById,
  updateFarmer,
  deleteFarmer,
};
