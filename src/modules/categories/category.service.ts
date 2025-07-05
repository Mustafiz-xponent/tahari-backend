/**
 * Service layer for Category entity operations.
 * Contains business logic and database interactions for categories.
 */
import { getErrorMessage } from "@/utils/errorHandler";
import prisma from "@/prisma-client/prismaClient";
import { Category, Product } from "@/generated/prisma/client";
import {
  UpdateCategoryDto,
  CreateCategoryDto,
} from "@/modules/categories/category.dto";
import {
  getBatchAccessibleImageUrls,
  processProductsWithAccessibleUrls,
} from "@/utils/fileUpload/s3Aws";
import {
  uploadFileToS3,
  getAccessibleImageUrl,
} from "@/utils/fileUpload/s3Aws";
import { multerFileToFileObject } from "@/utils/fileUpload/configMulterUpload";

export interface ProductWithAccessibleImages extends Product {
  accessibleImageUrls: string[];
}

// types.ts (Add this type definition)
export interface CategoryWithAccessibleImages
  extends Omit<Category, "products"> {
  products: ProductWithAccessibleImages[];
}

interface IMulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}
// Create a new category
export const createCategory = async ({
  data,
  file,
}: {
  data: CreateCategoryDto;
  file?: IMulterFile;
}): Promise<Category> => {
  try {
    // Upload image to S3
    let result;
    if (file) {
      const fileObject = multerFileToFileObject(file);
      result = await uploadFileToS3(fileObject, "categories", undefined, true);
    }

    return await prisma.category.create({
      data: {
        ...data,
        imageUrl: result ? result.url : null,
      },
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
    const categoriesWithUrls = await Promise.all(
      categories.map(async (category) => {
        let accessibleUrl: string | undefined;
        if (category.imageUrl) {
          accessibleUrl = await getAccessibleImageUrl(
            category.imageUrl as string,
            category.isPrivateImage
          );
        }
        return {
          ...category,
          accessibleImageUrl: accessibleUrl,
        };
      })
    );
    // Process each category to add accessible URLs to products
    const processedCategories = await Promise.all(
      categoriesWithUrls.map(async (category) => {
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
