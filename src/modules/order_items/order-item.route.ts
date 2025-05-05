/**
 * Routes for OrderItem entity operations.
 * Defines API endpoints for order item-related CRUD operations.
 */

import { Router } from "express";
import * as OrderItemController from "./order-item.controller";

const router = Router();

// Route to create a new order item
router.post("/", OrderItemController.createOrderItem);

// Route to get all order items
router.get("/", OrderItemController.getAllOrderItems);

// Route to get an order item by ID
router.get("/:id", OrderItemController.getOrderItemById);

// Route to update an order item's details
router.put("/:id", OrderItemController.updateOrderItem);

// Route to delete an order item
router.delete("/:id", OrderItemController.deleteOrderItem);

export default router;
