/**
 * Service layer for Category entity operations.
 * Contains business logic and database interactions for categories.
 */

import { getErrorMessage } from "../../utils/errorHandler";
import prisma from "../../prisma-client/prismaClient";
import { Category, Product } from "@/generated/prisma/client";
import { CreateCategoryDto, UpdateCategoryDto } from "./category.dto";
import {
  getBatchAccessibleImageUrls,
  processProductsWithAccessibleUrls,
} from "../../utils/fileUpload/s3Aws";

export interface ProductWithAccessibleImages extends Product {
  accessibleImageUrls: string[];
}

// types.ts (Add this type definition)
export interface CategoryWithAccessibleImages
  extends Omit<Category, "products"> {
  products: ProductWithAccessibleImages[];
}

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

// // Get all categories
// export const getAllCategories = async (): Promise<Category[]> => {
//   try {
//     return await prisma.category.findMany({
//       include: {
//         products: true,
//       },
//     });
//   } catch (error) {
//     throw new Error(`Error fetching categories: ${getErrorMessage(error)}`);
//   }
// };

/**
 * Get all categories with products that have accessible image URLs
 */
export const getAllCategories = async (
  generateAccessibleUrls = true,
  urlExpiresIn = 300
) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: true,
      },
    });

    // Process each category to add accessible URLs to products
    const processedCategories = await Promise.all(
      categories.map(async (category) => {
        const processedProducts = await Promise.all(
          category.products.map(async (product) => {
            if (generateAccessibleUrls && product.imageUrls.length > 0) {
              const accessibleUrls = await getBatchAccessibleImageUrls(
                product.imageUrls,
                product.isPrivateImages || false,
                urlExpiresIn
              );

              return {
                ...product,
                accessibleImageUrls: accessibleUrls,
              };
            }

            return {
              ...product,
              accessibleImageUrls: [],
            };
          })
        );

        return {
          ...category,
          products: processedProducts,
        };
      })
    );

    return processedCategories;
  } catch (error) {
    throw new Error(`Error fetching categories: ${getErrorMessage(error)}`);
  }
};

// // Get a category by ID
// export const getCategoryById = async (
//   categoryId: BigInt
// ): Promise<Category | null> => {
//   try {
//     return await prisma.category.findUnique({
//       where: { categoryId: Number(categoryId) },
//       include: {
//         products: true, // Include related products if needed
//       },
//     });
//   } catch (error) {
//     throw new Error(`Error fetching category by ID: ${getErrorMessage(error)}`);
//   }
// };

/**
 * Get a category by ID with products that have accessible image URLs
 */
export const getCategoryById = async (
  categoryId: BigInt,
  generateAccessibleUrls = true,
  urlExpiresIn = 300
) => {
  try {
    const category = await prisma.category.findUnique({
      where: { categoryId: Number(categoryId) },
      include: {
        products: true,
      },
    });

    if (!category) {
      return null;
    }

    // Process products to add accessible URLs
    const processedProducts = await Promise.all(
      category.products.map(async (product) => {
        if (generateAccessibleUrls && product.imageUrls.length > 0) {
          const accessibleUrls = await getBatchAccessibleImageUrls(
            product.imageUrls,
            product.isPrivateImages || false,
            urlExpiresIn
          );

          return {
            ...product,
            accessibleImageUrls: accessibleUrls,
          };
        }

        return {
          ...product,
          accessibleImageUrls: [],
        };
      })
    );

    return {
      ...category,
      products: processedProducts,
    };
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
