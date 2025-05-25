/**
 * Service layer for Product entity operations.
 * Updated to handle image uploads with product creation and updates.
 */

import prisma from "../../prisma-client/prismaClient";
import { Product } from "../../../generated/prisma/client";
import { CreateProductDto, UpdateProductDto } from "./product.dto";
import { getErrorMessage } from "../../utils/errorHandler";
import {
  uploadProductImages,
  replaceProductImages,
  deleteMultipleFilesFromS3,
  extractS3KeyFromUrl,
} from "../../utils/fileUpload/s3Aws";

/**
 * Create a new product with optional image uploads
 * @param data - Data required to create a product
 * @param imageFiles - Optional array of image files to upload
 * @returns The created product with image URLs
 * @throws Error if the product cannot be created
 */
export async function createProduct(
  data: CreateProductDto,
  imageFiles?: File[]
): Promise<Product> {
  try {
    // First create the product without images
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
        imageUrls: [], // Start with empty array
        categoryId: data.categoryId,
        farmerId: data.farmerId,
      },
    });

    // If images are provided, upload them and update the product
    if (imageFiles && imageFiles.length > 0) {
      try {
        const uploadResults = await uploadProductImages(
          imageFiles,
          product.productId
        );
        const imageUrls = uploadResults.map((result) => result.url);

        // Update product with image URLs
        const updatedProduct = await prisma.product.update({
          where: { productId: product.productId },
          data: { imageUrls },
        });

        return updatedProduct;
      } catch (uploadError) {
        // If image upload fails, we still have the product created
        // Log the error but don't fail the entire operation
        console.error(
          "Failed to upload images during product creation:",
          uploadError
        );
        return product;
      }
    }

    return product;
  } catch (error) {
    throw new Error(`Failed to create product: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieve all products with optional filtering and relations
 * @param includeRelations - Whether to include category and farmer relations
 * @returns An array of all products
 * @throws Error if the query fails
 */
export async function getAllProducts(
  includeRelations = false
): Promise<Product[]> {
  try {
    const products = await prisma.product.findMany({
      include: includeRelations
        ? {
            category: true,
            farmer: true,
          }
        : undefined,
    });
    return products;
  } catch (error) {
    throw new Error(`Failed to fetch products: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieve a product by its ID with optional relations
 * @param productId - The ID of the product
 * @param includeRelations - Whether to include category and farmer relations
 * @returns The product if found, or null if not found
 * @throws Error if the query fails
 */
export async function getProductById(
  productId: BigInt,
  includeRelations = false
): Promise<Product | null> {
  try {
    const product = await prisma.product.findUnique({
      where: { productId: Number(productId) },
      include: includeRelations
        ? {
            category: true,
            farmer: true,
          }
        : undefined,
    });
    return product;
  } catch (error) {
    throw new Error(`Failed to fetch product: ${getErrorMessage(error)}`);
  }
}

/**
 * Update a product by its ID with optional image uploads
 * @param productId - The ID of the product to update
 * @param data - Data to update the product
 * @param imageFiles - Optional array of new image files
 * @param replaceImages - Whether to replace existing images or add to them
 * @returns The updated product
 * @throws Error if the product is not found or update fails
 */
export async function updateProduct(
  productId: bigint,
  data: UpdateProductDto,
  imageFiles?: File[],
  replaceImages = false
): Promise<Product> {
  try {
    // Get current product to access existing image URLs
    const currentProduct = await prisma.product.findUnique({
      where: { productId: Number(productId) },
      select: { imageUrls: true },
    });

    if (!currentProduct) {
      throw new Error("Product not found");
    }

    let finalImageUrls = currentProduct.imageUrls;

    // Handle image uploads if provided
    if (imageFiles && imageFiles.length > 0) {
      try {
        if (replaceImages) {
          // Replace existing images
          const uploadResults = await replaceProductImages(
            imageFiles,
            currentProduct.imageUrls,
            productId
          );
          finalImageUrls = uploadResults.map((result) => result.url);
        } else {
          // Add to existing images
          const uploadResults = await uploadProductImages(
            imageFiles,
            productId
          );
          finalImageUrls = [
            ...currentProduct.imageUrls,
            ...uploadResults.map((result) => result.url),
          ];
        }
      } catch (uploadError) {
        console.error(
          "Failed to upload images during product update:",
          uploadError
        );
        // Continue with update without new images
      }
    }

    // Update the product
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
        imageUrls: data.imageUrls ?? finalImageUrls, // Use provided URLs or processed ones
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
 * Delete a product by its ID and clean up associated images
 * @param productId - The ID of the product to delete
 * @throws Error if the product is not found or deletion fails
 */
export async function deleteProduct(productId: BigInt): Promise<void> {
  try {
    // First, get the product to access image URLs
    const product = await prisma.product.findUnique({
      where: { productId: Number(productId) },
      select: { imageUrls: true },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Delete the product from database first
    await prisma.product.delete({
      where: { productId: Number(productId) },
    });

    // Clean up images from S3 if they exist (async, don't block the response)
    if (product.imageUrls && product.imageUrls.length > 0) {
      const s3Keys = product.imageUrls
        .map(extractS3KeyFromUrl)
        .filter((key): key is string => key !== null);

      if (s3Keys.length > 0) {
        // Run cleanup in background
        deleteMultipleFilesFromS3(s3Keys)
          .then(() => {
            console.log("✅ Successfully deleted S3 files:", s3Keys); // Success log
          })
          .catch((error) => {
            console.error(
              "Failed to cleanup S3 images after product deletion:",
              error
            );
          });
      }
    }
  } catch (error) {
    throw new Error(`Failed to delete product: ${getErrorMessage(error)}`);
  }
}

/**
 * Remove specific images from a product (utility function)
 * @param productId - The ID of the product
 * @param imageUrls - Array of image URLs to remove
 * @returns Updated product
 */
export async function removeSpecificProductImages(
  productId: BigInt,
  imageUrls: string[]
): Promise<Product> {
  try {
    // Get current product
    const currentProduct = await prisma.product.findUnique({
      where: { productId: Number(productId) },
      select: { imageUrls: true },
    });

    if (!currentProduct) {
      throw new Error("Product not found");
    }

    // Filter out the URLs to remove
    const updatedImageUrls = currentProduct.imageUrls.filter(
      (url) => !imageUrls.includes(url)
    );

    // Delete the images from S3 (async, don't block)
    const s3Keys = imageUrls
      .map(extractS3KeyFromUrl)
      .filter((key): key is string => key !== null);

    if (s3Keys.length > 0) {
      deleteMultipleFilesFromS3(s3Keys).catch((error) => {
        console.error("Failed to delete images from S3:", error);
      });
    }

    // Update product with remaining image URLs
    const updatedProduct = await prisma.product.update({
      where: { productId: Number(productId) },
      data: { imageUrls: updatedImageUrls },
    });

    return updatedProduct;
  } catch (error) {
    throw new Error(
      `Failed to remove product images: ${getErrorMessage(error)}`
    );
  }
}
