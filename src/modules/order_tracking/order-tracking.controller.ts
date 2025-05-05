/**
 * Controller layer for OrderTracking entity operations.
 * Handles HTTP requests and responses for order tracking-related endpoints.
 */

import { Request, Response } from "express";
import * as orderTrackingService from "./order-tracking.service";
import {
  zCreateOrderTrackingDto,
  zUpdateOrderTrackingDto,
} from "./order-tracking.dto";
import { ZodError, z } from "zod";

const trackingIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Tracking ID must be a positive integer",
});

/**
 * Create a new order tracking entry
 */
export const createOrderTracking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCreateOrderTrackingDto.parse(req.body);
    const orderTracking = await orderTrackingService.createOrderTracking(data);
    res
      .status(201)
      .json({ message: "Order tracking created successfully", orderTracking });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error creating order tracking:", error);
    res.status(500).json({ message: "Failed to create order tracking" });
  }
};

/**
 * Get all order tracking entries
 */
export const getAllOrderTrackings = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const orderTrackings = await orderTrackingService.getAllOrderTrackings();
    res.json(orderTrackings);
  } catch (error) {
    console.error("Error fetching order trackings:", error);
    res.status(500).json({ message: "Failed to fetch order trackings" });
  }
};

/**
 * Get a single order tracking entry by ID
 */
export const getOrderTrackingById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const trackingId = trackingIdSchema.parse(req.params.id);
    const orderTracking = await orderTrackingService.getOrderTrackingById(
      trackingId
    );
    if (!orderTracking) {
      res.status(404).json({ message: "Order tracking not found" });
      return;
    }
    res.json(orderTracking);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error fetching order tracking:", error);
    res.status(500).json({ message: "Failed to fetch order tracking" });
  }
};

/**
 * Update an order tracking entry by ID
 */
export const updateOrderTracking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const trackingId = trackingIdSchema.parse(req.params.id);
    const data = zUpdateOrderTrackingDto.parse(req.body);
    const updated = await orderTrackingService.updateOrderTracking(
      trackingId,
      data
    );
    res.json({
      message: "Order tracking updated successfully",
      orderTracking: updated,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error updating order tracking:", error);
    res.status(500).json({ message: "Failed to update order tracking" });
  }
};

/**
 * Delete an order tracking entry by ID
 */
export const deleteOrderTracking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const trackingId = trackingIdSchema.parse(req.params.id);
    await orderTrackingService.deleteOrderTracking(trackingId);
    res.json({ message: "Order tracking deleted successfully" });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error deleting order tracking:", error);
    res.status(500).json({ message: "Failed to delete order tracking" });
  }
};
