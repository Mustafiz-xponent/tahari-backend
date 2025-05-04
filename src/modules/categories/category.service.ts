/**
 * Service layer for Category entity operations.
 * Contains business logic and database interactions for categories.
 */

import { CreateCategoryDto, UpdateCategoryDto } from "./category.dto";
import prisma from "../../prisma-client/prismaClient";
import { Category } from "../../../generated/prisma/client";
import { getErrorMessage } from "@/utils/errorHandler";

/**
 * Create a new category
 * @param data - Data required to create a category
 * @returns The created category
 * @throws Error if the category cannot be created (e.g., duplicate name)
 */
export async function createCategory(
  data: CreateCategoryDto
): Promise<Category> {
  try {
    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return category;
  } catch (error) {
    throw new Error(`Failed to create category: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieve all categories
 * @returns An array of all categories
 * @throws Error if the query fails
 */
export async function getAllCategories(): Promise<Category[]> {
  try {
    const categories = await prisma.category.findMany();
    return categories;
  } catch (error) {
    throw new Error(`Failed to fetch categories: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieve a category by its ID
 * @param categoryId - The ID of the category
 * @returns The category if found, or null if not found
 * @throws Error if the query fails
 */
export async function getCategoryById(
  categoryId: BigInt
): Promise<Category | null> {
  try {
    const category = await prisma.category.findUnique({
      where: { categoryId: Number(categoryId) },
    });
    return category;
  } catch (error) {
    throw new Error(`Failed to fetch category: ${getErrorMessage(error)}`);
  }
}

/**
 * Update a category by its ID
 * @param categoryId - The ID of the category to update
 * @param data - Data to update the category
 * @returns The updated category
 * @throws Error if the category is not found or update fails
 */
export async function updateCategory(
  categoryId: BigInt,
  data: UpdateCategoryDto
): Promise<Category> {
  try {
    const category = await prisma.category.update({
      where: { categoryId: Number(categoryId) },
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return category;
  } catch (error) {
    throw new Error(`Failed to update category: ${getErrorMessage(error)}`);
  }
}

/**
 * Delete a category by its ID
 * @param categoryId - The ID of the category to delete
 * @throws Error if the category is not found or deletion fails
 */
export async function deleteCategory(categoryId: BigInt): Promise<void> {
  try {
    await prisma.category.delete({
      where: { categoryId: Number(categoryId) },
    });
  } catch (error) {
    throw new Error(`Failed to delete category: ${getErrorMessage(error)}`);
  }
}
