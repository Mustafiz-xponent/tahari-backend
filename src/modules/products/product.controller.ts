/**
 * Controller layer for Product entity operations.
 * Handles HTTP requests and responses for product-related endpoints.
 */

import { Request, Response } from "express";
import * as productService from "./product.service";
import { zCreateProductDto, zUpdateProductDto } from "./product.dto";
import { z } from "zod";
import { handleErrorResponse } from "../../utils/errorResponseHandler";

const productIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Product ID must be a positive integer",
});

/**
 * Create a new product
 */
export const createProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCreateProductDto.parse(req.body);
    const product = await productService.createProduct(data);
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    handleErrorResponse(error, res, "create product");
  }
};

/**
 * Get all products
 */
export const getAllProducts = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const products = await productService.getAllProducts();
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
 * Get a single product by ID
 */
export const getProductById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const productId = productIdSchema.parse(req.params.id);
    const product = await productService.getProductById(productId);
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
 * Update a product by ID
 */
export const updateProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const productId = productIdSchema.parse(req.params.id);
    const data = zUpdateProductDto.parse(req.body);
    const updated = await productService.updateProduct(productId, data);
    res.json({
      success: true,
      message: "Product updated successfully",
      data: updated,
    });
  } catch (error) {
    handleErrorResponse(error, res, "update product");
  }
};

/**
 * Delete a product by ID
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
