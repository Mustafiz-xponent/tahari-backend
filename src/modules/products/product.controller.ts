/**
 * Controller layer for Product entity operations.
 * Updated to handle image uploads with product creation and updates.
 */

import { Request, Response } from "express";
import { z } from "zod";
import { upload } from "@/utils/fileUpload/configMulterUpload";
import { handleErrorResponse } from "@/utils/errorResponseHandler";
import {
  productNameSchema,
  zCreateProductDto,
  zUpdateProductDto,
} from "@/modules/products/product.dto";
import * as productService from "@/modules/products/product.service";

const productIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Product ID must be a positive integer",
});

// Types for pagination
interface PaginationQuery {
  page?: string;
  limit?: string;
  include?: string;
}

interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

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
      res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
      });
    } catch (error) {
      handleErrorResponse(error, res, "create product");
    }
  },
];

/**
 * Get all products with optional relations
 */
// export const getAllProducts = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const includeRelations = req.query.include === "relations";
//     const products = await productService.getAllProducts(includeRelations);
//     res.json({
//       success: true,
//       message: "Products retrieved successfully",
//       data: products,
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "fetch products");
//   }
// };

/**
 * Get all products with optional relations and pagination
 */
export const getAllProducts = async (
  req: Request<{}, {}, {}, PaginationQuery>,
  res: Response
): Promise<void> => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Max 100 items per page
    const skip = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1) {
      res.status(400).json({
        success: false,
        message: "Page number must be greater than 0",
      });
      return;
    }

    if (limit < 1) {
      res.status(400).json({
        success: false,
        message: "Limit must be greater than 0",
      });
      return;
    }

    const includeRelations = req.query.include === "relations";

    const paginationParams: PaginationParams = {
      page,
      limit,
      skip,
    };

    const result = await productService.getAllProducts(
      includeRelations,
      true, // generateAccessibleUrls
      300, // urlExpiresIn
      paginationParams
    );

    res.json({
      success: true,
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
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.json({
      success: true,
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
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }
    res.json({
      success: true,
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
      res.json({
        success: true,
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
    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete product");
  }
};
