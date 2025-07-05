/**
 * Routes for Order entity operations.
 * Defines API endpoints for order-related CRUD operations.
 */

import { Router } from "express";
import * as OrderController from "@/modules/orders/orders.controller";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";

const router = Router();

// Route to create a new order
router.post("/", OrderController.createOrder);

// Route to get all orders
router.get("/", OrderController.getAllOrders);

// Route to get orders for a specific customer
router.get(
  "/customer",
  authMiddleware,
  authorizeRoles("CUSTOMER"),
  OrderController.getCustomerOrders
);

// Route to get an order by ID
router.get("/:id", OrderController.getOrderById);

// Route to update an order's details
router.put("/:id", OrderController.updateOrder);

// Route to delete an order
router.delete("/:id", OrderController.deleteOrder);

export default router;
