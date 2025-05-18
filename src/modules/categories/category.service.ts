/**
 * Service layer for Category entity operations.
 * Contains business logic and database interactions for categories.
 */

import { getErrorMessage } from "../../utils/errorHandler";
import prisma from "../../prisma-client/prismaClient";
import { Category } from "@/generated/prisma/client";
import { CreateCategoryDto, UpdateCategoryDto } from "./category.dto";

// Create a new category
export const createCategory = async (
  data: CreateCategoryDto
): Promise<Category> => {
  try {
    return await prisma.category.create({
      data,
    });
  } catch (error) {
    throw new Error(`Error creating category: ${getErrorMessage(error)}`);
  }
};

// Get all categories
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    return await prisma.category.findMany();
  } catch (error) {
    throw new Error(`Error fetching categories: ${getErrorMessage(error)}`);
  }
};

// Get a category by ID
export const getCategoryById = async (
  categoryId: BigInt
): Promise<Category | null> => {
  try {
    return await prisma.category.findUnique({
      where: { categoryId: Number(categoryId) },
      include: {
        products: true, // Include related products if needed
      },
    });
  } catch (error) {
    throw new Error(`Error fetching category by ID: ${getErrorMessage(error)}`);
  }
};

// Update a category's details
export const updateCategory = async (
  categoryId: bigint,
  data: UpdateCategoryDto
): Promise<Category> => {
  try {
    return await prisma.category.update({
      where: { categoryId: Number(categoryId) },
      data,
    });
  } catch (error) {
    throw new Error(`Error updating category: ${getErrorMessage(error)}`);
  }
};

// Delete a category
export const deleteCategory = async (categoryId: BigInt): Promise<Category> => {
  try {
    return await prisma.category.delete({
      where: { categoryId: Number(categoryId) },
    });
  } catch (error) {
    throw new Error(`Error deleting category: ${getErrorMessage(error)}`);
  }
};
