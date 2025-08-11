/**
 * Controller layer for Product entity operations.
 * Updated to handle image uploads with product creation and updates.
 */

import { Request, Response } from "express";
import { z } from "zod";
import { upload } from "@/utils/fileUpload/configMulterUpload";
import { handleErrorResponse } from "@/utils/errorResponseHandler";
import {
  GetAllProductsQueryDto,
  productNameSchema,
  zCreateProductDto,
  zUpdateProductDto,
} from "@/modules/products/product.dto";
import * as productService from "@/modules/products/product.service";
import httpStatus from "http-status";
import sendResponse from "@/utils/sendResponse";
import { Product } from "@/generated/prisma/client";

const productIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Product ID must be a positive integer",
});

/**
 * Create a new product with optional image uploads
 */
export const createProduct = [
  upload.array("images", 10), // Allow up to 10 images
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = zCreateProductDto.parse(req.body);
      const files = req.files as Express.Multer.File[];

      // Convert multer files to File objects if images are provided
      let imageFiles: File[] = [];
      if (files && files.length > 0) {
        imageFiles = files.map((file) => {
          const blob = new Blob([file.buffer], { type: file.mimetype });
          return new File([blob], file.originalname, { type: file.mimetype });
        });
      }

      const product = await productService.createProduct(
        data,
        imageFiles,
        true
      );

      sendResponse<Product>(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Product created successfully",
        data: product,
      });
    } catch (error) {
      handleErrorResponse(error, res, "create product");
    }
  },
];
/**
 * Get all products with optional relations and pagination
 */
export const getAllProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { page, limit, isSubscription, sort, isPreorder, name, categoryId } =
      req.query as unknown as GetAllProductsQueryDto;
    const skip = (page - 1) * limit;

    const includeRelations = req.query.include === "relations";
    const filters = { isSubscription, isPreorder, name, categoryId };
    const paginationParams = { page, limit, skip, sort };

    const result = await productService.getAllProducts(
      includeRelations,
      true, // generateAccessibleUrls
      300, // urlExpiresIn
      paginationParams,
      filters
    );

    sendResponse<Product[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Products retrieved successfully",
      data: result.products,
      pagination: {
        currentPage: page,
        totalPages: result.totalPages,
        totalItems: result.totalCount,
        itemsPerPage: limit,
        hasNextPage: page < result.totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch products");
  }
};

/**
 * Get product by name with optional relations
 */
export const getProductByName = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const productName = productNameSchema.parse(req.params.name);
    const includeRelations = req.query.include === "relations";

    const product = await productService.getProductByName(
      productName,
      includeRelations
    );

    if (!product) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Product not found",
      });
      return;
    }
    sendResponse<productService.ProductWithAccessibleImages[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Product retrieved successfully",
      data: product,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch product by name");
  }
};

/**
 * Get a single product by ID with optional relations
 */
export const getProductById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const productId = productIdSchema.parse(req.params.id);
    const includeRelations = req.query.include === "relations";
    const product = await productService.getProductById(
      productId,
      includeRelations
    );
    if (!product) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Product not found",
      });
      return;
    }
    sendResponse<Product>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Product retrieved successfully",
      data: product,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch product");
  }
};

/**
 * Update a product by ID with optional image uploads
 */
export const updateProduct = [
  upload.array("images", 10), // Allow up to 10 images
  async (req: Request, res: Response): Promise<void> => {
    try {
      const productId = productIdSchema.parse(req.params.id);
      const data = zUpdateProductDto.parse(req.body);
      const files = req.files as Express.Multer.File[];

      // Convert multer files to File objects if images are provided
      let imageFiles: File[] = [];
      if (files && files.length > 0) {
        imageFiles = files.map((file) => {
          const blob = new Blob([file.buffer], { type: file.mimetype });
          return new File([blob], file.originalname, { type: file.mimetype });
        });
      }

      // Check if images should replace existing ones
      const replaceImages = req.body.replaceImages === "true";

      const updated = await productService.updateProduct(
        productId,
        data,
        imageFiles,
        replaceImages
      );
      sendResponse<Product>(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Product updated successfully",
        data: updated,
      });
    } catch (error) {
      handleErrorResponse(error, res, "update product");
    }
  },
];

/**
 * Delete a product by ID (automatically handles image cleanup)
 */
export const deleteProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const productId = productIdSchema.parse(req.params.id);
    await productService.deleteProduct(productId);

    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Product deleted successfully",
      data: null,
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete product");
  }
};
