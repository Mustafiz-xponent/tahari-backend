//src/modules/products/product.service.ts

/**
 * Service layer for Product entity operations.
 * Contains business logic and database interactions for products.
 */

import prisma from "../../prisma-client/prismaClient";
import { Product } from "../../../generated/prisma/client";
import { CreateProductDto, UpdateProductDto } from "./product.dto";
import { getErrorMessage } from "../../utils/errorHandler";

/**
 * Create a new product
 * @param data - Data required to create a product
 * @returns The created product
 * @throws Error if the product cannot be created (e.g., invalid foreign keys)
 */
export async function createProduct(data: CreateProductDto): Promise<Product> {
  try {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        stockQuantity: data.stockQuantity ?? 0,
        reorderLevel: data.reorderLevel ?? 0,
        isSubscription: data.isSubscription ?? false,
        isPreorder: data.isPreorder ?? false,
        preorderAvailabilityDate: data.preorderAvailabilityDate,
        categoryId: data.categoryId,
        farmerId: data.farmerId,
      },
    });
    return product;
  } catch (error) {
    throw new Error(`Failed to create product: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieve all products
 * @returns An array of all products
 * @throws Error if the query fails
 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const products = await prisma.product.findMany();
    return products;
  } catch (error) {
    throw new Error(`Failed to fetch products: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieve a product by its ID
 * @param productId - The ID of the product
 * @returns The product if found, or null if not found
 * @throws Error if the query fails
 */
export async function getProductById(
  productId: BigInt
): Promise<Product | null> {
  try {
    const product = await prisma.product.findUnique({
      where: { productId: Number(productId) },
    });
    return product;
  } catch (error) {
    throw new Error(`Failed to fetch product: ${getErrorMessage(error)}`);
  }
}

/**
 * Update a product by its ID
 * @param productId - The ID of the product to update
 * @param data - Data to update the product
 * @returns The updated product
 * @throws Error if the product is not found or update fails
 */
export async function updateProduct(
  productId: BigInt,
  data: UpdateProductDto
): Promise<Product> {
  try {
    const product = await prisma.product.update({
      where: { productId: Number(productId) },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        stockQuantity: data.stockQuantity,
        reorderLevel: data.reorderLevel,
        isSubscription: data.isSubscription,
        isPreorder: data.isPreorder,
        preorderAvailabilityDate: data.preorderAvailabilityDate,
        categoryId: data.categoryId,
        farmerId: data.farmerId,
      },
    });
    return product;
  } catch (error) {
    throw new Error(`Failed to update product: ${getErrorMessage(error)}`);
  }
}

/**
 * Delete a product by its ID
 * @param productId - The ID of the product to delete
 * @throws Error if the product is not found or deletion fails
 */
export async function deleteProduct(productId: BigInt): Promise<void> {
  try {
    await prisma.product.delete({
      where: { productId: Number(productId) },
    });
  } catch (error) {
    throw new Error(`Failed to delete product: ${getErrorMessage(error)}`);
  }
}
