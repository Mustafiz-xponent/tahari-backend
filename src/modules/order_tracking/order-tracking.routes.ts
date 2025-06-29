/**
 * Routes for OrderTracking entity operations.
 * Defines API endpoints for order tracking-related CRUD operations.
 */

import { Router } from "express";
import * as OrderTrackingController from "./order-tracking.controller";

const router = Router();

// Route to create a new order tracking entry
router.post("/", OrderTrackingController.createOrderTracking);

// Route to get all order tracking entries
router.get("/", OrderTrackingController.getAllOrderTrackings);

// Route to get order tracking entry by (***ORDER ID***)
router.get("/:orderId", OrderTrackingController.getOrderTrackingsByOrderId);

// Route to update an order tracking entry's details
router.put("/:id", OrderTrackingController.updateOrderTracking);

// Route to delete an order tracking entry
router.delete("/:id", OrderTrackingController.deleteOrderTracking);

export default router;
