/**
 * Routes for Product entity operations.
 * Defines API endpoints for product-related CRUD operations.
 */

import { Router } from "express";
import * as ProductController from "./product.controller";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

// Route to create a new product
router.post("/", authMiddleware("ADMIN"), ProductController.createProduct);

// Route to get all products
router.get("/", ProductController.getAllProducts);

// Route to get a product by ID
router.get("/:id", ProductController.getProductById);

// Route to update a product's details
router.put("/:id", authMiddleware("ADMIN"), ProductController.updateProduct);

// Route to delete a product
router.delete("/:id", authMiddleware("ADMIN"), ProductController.deleteProduct);

export default router;
