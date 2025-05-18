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
  return await prisma.category.create({
    data,
  });
};

// Get all categories
export const getAllCategories = async (): Promise<Category[]> => {
  return await prisma.category.findMany();
};

// Get a category by ID
export const getCategoryById = async (
  categoryId: BigInt
): Promise<Category | null> => {
  return await prisma.category.findUnique({
    where: { categoryId: Number(categoryId) },
    // include: {
    //   products: true, // Include related products if needed
    // },
  });
};

// Update a category's details
export const updateCategory = async (
  categoryId: bigint,
  data: UpdateCategoryDto
): Promise<Category> => {
  return await prisma.category.update({
    where: { categoryId: Number(categoryId) },
    data,
  });
};

// Delete a category
export const deleteCategory = async (categoryId: BigInt): Promise<Category> => {
  return await prisma.category.delete({
    where: { categoryId: Number(categoryId) },
  });
};
