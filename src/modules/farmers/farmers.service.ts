// src/modules/farmers/farmers.service.ts

import { getErrorMessage } from "@/utils/errorHandler";
import prisma from "../../prisma-client/prismaClient";
import { Farmer } from "@prisma/client"; // Import the Farmer type from Prisma Client

// Create a new farmer
export const createFarmer = async (data: {
  name: string;
  farmName: string;
  address: string;
  contactInfo?: string;
}): Promise<Farmer> => {
  try {
    return await prisma.farmer.create({
      data,
    });
  } catch (error) {
    throw new Error(`Error creating farmer: ${getErrorMessage(error)}`);
  }
};

// Get all farmers
export const getAllFarmers = async (): Promise<Farmer[]> => {
  try {
    return await prisma.farmer.findMany();
  } catch (error) {
    throw new Error(`Error fetching farmers: ${getErrorMessage(error)}`);
  }
};

// Get a farmer by ID
export const getFarmerById = async (
  farmerId: BigInt
): Promise<Farmer | null> => {
  try {
    return await prisma.farmer.findUnique({
      where: { farmerId: Number(farmerId) }, // Convert BigInt to Number for Prisma compatibility
    });
  } catch (error) {
    throw new Error(`Error fetching farmer by ID: ${getErrorMessage(error)}`);
  }
};

// Update a farmer's details
export const updateFarmer = async (
  farmerId: BigInt,
  data: {
    name?: string;
    farmName?: string;
    address?: string;
    contactInfo?: string;
  }
): Promise<Farmer> => {
  try {
    return await prisma.farmer.update({
      where: { farmerId: Number(farmerId) }, // Convert BigInt to Number for Prisma compatibility
      data,
    });
  } catch (error) {
    throw new Error(`Error updating farmer: ${getErrorMessage(error)}`);
  }
};

// Delete a farmer
export const deleteFarmer = async (farmerId: BigInt): Promise<Farmer> => {
  try {
    return await prisma.farmer.delete({
      where: { farmerId: Number(farmerId) }, // Convert BigInt to Number for Prisma compatibility
    });
  } catch (error) {
    throw new Error(`Error deleting farmer: ${getErrorMessage(error)}`);
  }
};
