/**
 * Controller layer for Product entity operations.
 * Updated to handle image uploads with product creation and updates.
 */

import { Request, Response } from "express";
import { z } from "zod";
import upload from "../../utils/fileUpload/configMulterUpload";
import { handleErrorResponse } from "../../utils/errorResponseHandler";
import { zCreateProductDto, zUpdateProductDto } from "./product.dto";
import * as productService from "./product.service";

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
export const getAllProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const includeRelations = req.query.include === "relations";
    const products = await productService.getAllProducts(includeRelations);
    res.json({
      success: true,
      message: "Products retrieved successfully",
      data: products,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch products");
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
