/**
 * Service layer for Product entity operations.
 * Updated to handle image uploads with product creation and updates.
 */
import { Prisma, Product } from "@/generated/prisma/client";
import prisma from "@/prisma-client/prismaClient";
import { getErrorMessage } from "@/utils/errorHandler";
import {
  deleteMultipleFilesFromS3,
  extractS3KeyFromUrl,
  getBatchAccessibleImageUrls,
  processProductsWithAccessibleUrls,
  replaceProductImages,
  uploadProductImages,
} from "@/utils/fileUpload/s3Aws";
import {
  CreateProductDto,
  UpdateProductDto,
} from "@/modules/products/product.dto";
import logger from "@/utils/logger";
import { Decimal } from "@/generated/prisma/client/runtime/library";
import {
  calculateDealPricing,
  DealPricingResult,
} from "@/utils/calculateDealPricing";

// Add interface for product with accessible URLs
interface ProductWithAccessibleImages extends Omit<Product, "imageUrls"> {
  imageUrls: string[];
  accessibleImageUrls?: string[];
}

interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  sort: string;
}

interface PaginatedProductResult {
  products: ProductWithAccessibleImages[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Create a new product with optional image uploads
 * @param data - Data required to create a product
 * @param imageFiles - Optional array of image files to upload
 * @param usePrivateBucket - Whether to store images in private bucket
 * @returns The created product with image URLs
 * @throws Error if the product cannot be created
 */
export async function createProduct(
  data: CreateProductDto,
  imageFiles?: File[],
  usePrivateBucket: boolean = false
): Promise<Product> {
  try {
    // First create the product without images
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        unitPrice: data.unitPrice,
        unitType: data.unitType,
        packageSize: data.packageSize,
        stockQuantity: data.stockQuantity ?? 0,
        reorderLevel: data.reorderLevel ?? 0,
        isSubscription: data.isSubscription ?? false,
        isPreorder: data.isPreorder ?? false,
        preorderAvailabilityDate: data.preorderAvailabilityDate,
        imageUrls: [], // Start with empty array
        isPrivateImages: usePrivateBucket, // Store whether images are private
        categoryId: data.categoryId,
        farmerId: data.farmerId,
      },
    });

    // If images are provided, upload them and update the product
    if (imageFiles && imageFiles.length > 0) {
      try {
        const uploadResults = await uploadProductImages(
          imageFiles,
          product.productId,
          usePrivateBucket
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
 * Retrieve all products with optional filtering, relations, and pagination
 * @param includeRelations - Whether to include category and farmer relations
 * @param generateAccessibleUrls - Whether to generate presigned URLs for private images
 * @param urlExpiresIn - Expiration time for presigned URLs in seconds
 * @param paginationParams - Pagination parameters (page, limit, skip)
 * @returns Paginated products with accessible image URLs and pagination metadata
 * @throws Error if the query fails
 */
export async function getAllProducts(
  includeRelations = false,
  generateAccessibleUrls = true,
  urlExpiresIn = 300,
  paginationParams: PaginationParams,
  filters?: {
    isSubscription?: boolean;
    isPreorder?: boolean;
    name?: string;
    categoryId?: bigint;
  }
): Promise<PaginatedProductResult> {
  try {
    const { limit, skip, page, sort } = paginationParams;

    // Build dynamic where clause
    const whereClause = {
      ...(filters?.isSubscription !== undefined && {
        isSubscription: filters.isSubscription,
      }),
      ...(filters?.isPreorder !== undefined && {
        isPreorder: filters.isPreorder,
      }),
      ...(filters?.name && {
        name: {
          contains: filters.name,
          mode: "insensitive" as Prisma.QueryMode,
        },
      }),
      ...(filters?.categoryId && {
        categoryId: filters.categoryId,
      }),
    };

    // Get paginated products with optional relations
    const products = await prisma.product.findMany({
      where: whereClause,
      include: includeRelations
        ? {
            category: true,
            farmer: true,
            deal: true,
          }
        : { deal: true }, // ensure we fetch deal for pricing calculation
      take: limit,
      skip: skip,
      orderBy: {
        createdAt: sort === "asc" ? "asc" : "desc",
      },
    });

    // Process images if needed
    let processedProducts = generateAccessibleUrls
      ? await processProductsWithAccessibleUrls(products, urlExpiresIn)
      : products.map((product) => ({
          ...product,
          accessibleImageUrls: [],
        }));

    // Apply pricing calculation
    processedProducts = await Promise.all(
      processedProducts.map(async (product) => {
        const {
          hasActiveDeal,
          hasActiveGlobalDeal,
          discountUnitPrice,
          discountType,
          discountValue,
        } = await calculateDealPricing(product);
        return {
          ...product,
          hasActiveDeal,
          hasActiveGlobalDeal,
          discountType,
          discountValue,
          discountUnitPrice,
        };
      })
    );

    // Count for pagination
    const totalCount = await prisma.product.count({ where: whereClause });
    const totalPages = Math.ceil(totalCount / limit);

    return {
      products: processedProducts,
      totalCount,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.log(error);
    throw new Error(`Failed to fetch products: ${getErrorMessage(error)}`);
  }
}

/**
 * Fetches products by a partial name match, with optional inclusion of related data
 * and generation of accessible image URLs.
 *
 * @param {string} productName - The partial name to search for products.
 * @param {boolean} [includeRelations=false] - Whether to include related data (category and farmer) in the results.
 * @param {boolean} [generateAccessibleUrls=true] - Whether to generate accessible image URLs for the products.
 * @param {number} [urlExpiresIn=300] - Expiry time in seconds for generated accessible image URLs.
 * @returns {Promise<ProductWithAccessibleImages[]>} - A promise resolving to an array of products with accessible image URLs.
 * @throws {Error} - Throws an error if the fetching process fails.
 */
export async function getProductByName(
  productName: string,
  includeRelations = false,
  generateAccessibleUrls = true,
  urlExpiresIn = 300
): Promise<ProductWithAccessibleImages[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        name: {
          contains: productName,
          mode: "insensitive", // Case-insensitive partial search
        },
      },
      include: includeRelations
        ? {
            category: true,
            farmer: true,
          }
        : undefined,
    });

    if (!products || products.length === 0) {
      return [];
    }

    // Generate accessible URLs if requested
    const processedProducts = generateAccessibleUrls
      ? await processProductsWithAccessibleUrls(products, urlExpiresIn)
      : products.map((product) => ({ ...product, accessibleImageUrls: [] }));

    return processedProducts;
  } catch (error) {
    throw new Error(
      `Failed to fetch products by partial name: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Retrieve a product by its ID with optional relations
 * @param productId - The ID of the product
 * @param includeRelations - Whether to include category and farmer relations
 * @param generateAccessibleUrls - Whether to generate presigned URLs for private images
 * @param urlExpiresIn - Expiration time for presigned URLs in seconds
 * @returns The product if found with accessible image URLs, or null if not found
 * @throws Error if the query fails
 */
export async function getProductById(
  productId: bigint,
  includeRelations = false,
  generateAccessibleUrls = true,
  urlExpiresIn = 300
): Promise<(ProductWithAccessibleImages & DealPricingResult) | null> {
  try {
    const product = await prisma.product.findUnique({
      where: { productId: Number(productId) },
      include: includeRelations
        ? {
            category: true,
            farmer: true,
            deal: true,
          }
        : { deal: true },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Calculate deal pricing
    const {
      hasActiveDeal,
      hasActiveGlobalDeal,
      discountUnitPrice,
      discountType,
      discountValue,
    } = await calculateDealPricing(product);

    // Generate accessible URLs if requested
    let accessibleImageUrls: string[] = [];
    if (generateAccessibleUrls && product.imageUrls.length > 0) {
      accessibleImageUrls = await getBatchAccessibleImageUrls(
        product.imageUrls,
        product.isPrivateImages || false,
        urlExpiresIn
      );
    }

    return {
      ...product,
      accessibleImageUrls,
      hasActiveDeal,
      hasActiveGlobalDeal,
      discountUnitPrice,
      discountType,
      discountValue,
    };
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
 * @param usePrivateBucket - Whether new images should be stored in private bucket
 * @returns The updated product
 * @throws Error if the product is not found or update fails
 */
export async function updateProduct(
  productId: bigint,
  data: UpdateProductDto,
  imageFiles?: File[],
  replaceImages = false,
  usePrivateBucket?: boolean
): Promise<Product> {
  try {
    // Get current product to access existing image URLs and privacy setting
    const currentProduct = await prisma.product.findUnique({
      where: { productId: Number(productId) },
      select: {
        imageUrls: true,
        isPrivateImages: true,
        unitPrice: true,
        packageSize: true,
      },
    });

    if (!currentProduct) {
      throw new Error("Product not found");
    }

    // Determine privacy setting for new images
    const shouldUsePrivate =
      usePrivateBucket ?? currentProduct.isPrivateImages ?? false;
    let finalImageUrls = currentProduct.imageUrls;

    // Handle image uploads if provided
    if (imageFiles && imageFiles.length > 0) {
      try {
        if (replaceImages) {
          // Replace existing images
          const uploadResults = await replaceProductImages(
            imageFiles,
            currentProduct.imageUrls,
            productId,
            shouldUsePrivate,
            currentProduct.isPrivateImages || false
          );
          finalImageUrls = uploadResults.map((result) => result.url);
        } else {
          // Add to existing images
          const uploadResults = await uploadProductImages(
            imageFiles,
            productId,
            shouldUsePrivate
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
        unitPrice: data.unitPrice,
        unitType: data.unitType,
        packageSize: data.packageSize,
        stockQuantity: data.stockQuantity,
        reorderLevel: data.reorderLevel,
        isSubscription: data.isSubscription,
        isPreorder: data.isPreorder,
        preorderAvailabilityDate: data.preorderAvailabilityDate,
        imageUrls: data.imageUrls ?? finalImageUrls, // Use provided URLs or processed ones
        isPrivateImages: usePrivateBucket ?? currentProduct.isPrivateImages,
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
    // First, get the product to access image URLs and privacy setting
    const product = await prisma.product.findUnique({
      where: { productId: Number(productId) },
      select: {
        imageUrls: true,
        isPrivateImages: true,
      },
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
        deleteMultipleFilesFromS3(s3Keys, product.isPrivateImages || false)
          .then(() => {
            logger.info("✅ Successfully deleted S3 files:", s3Keys);
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
      select: {
        imageUrls: true,
        isPrivateImages: true,
      },
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
      deleteMultipleFilesFromS3(
        s3Keys,
        currentProduct.isPrivateImages || false
      ).catch((error) => {
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

/**
 * Generate fresh presigned URLs for a product's private images
 * @param productId - The ID of the product
 * @param expiresIn - Expiration time in seconds
 * @returns Array of presigned URLs
 */
export async function refreshProductImageUrls(
  productId: BigInt,
  expiresIn: number = 300
): Promise<string[]> {
  try {
    const product = await prisma.product.findUnique({
      where: { productId: Number(productId) },
      select: {
        imageUrls: true,
        isPrivateImages: true,
      },
    });

    if (!product || !product.imageUrls.length) {
      return [];
    }

    return await getBatchAccessibleImageUrls(
      product.imageUrls,
      product.isPrivateImages || false,
      expiresIn
    );
  } catch (error) {
    throw new Error(
      `Failed to refresh product image URLs: ${getErrorMessage(error)}`
    );
  }
}
