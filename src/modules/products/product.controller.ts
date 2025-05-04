/**
 * Controller layer for Product entity operations.
 * Handles HTTP requests and responses for product-related endpoints.
 */

import { Request, Response } from "express";
import * as productService from "./product.service";
import { zCreateProductDto, zUpdateProductDto } from "./product.dto";
import { ZodError, z } from "zod";

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
    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Failed to create product" });
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
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
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
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.json(product);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Failed to fetch product" });
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
    res.json({ message: "Product updated successfully", product: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Failed to update product" });
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
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Failed to delete product" });
  }
};
