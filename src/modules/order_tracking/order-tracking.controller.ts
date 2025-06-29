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
import { handleErrorResponse } from "../../utils/errorResponseHandler";
import { z } from "zod";

const idSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "ID must be a positive integer",
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
    res.status(201).json({
      success: true,
      message: "Order tracking created successfully",
      data: orderTracking,
    });
  } catch (error) {
    handleErrorResponse(error, res, "create order tracking");
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
    res.json({
      success: true,
      message: "Order trackings fetched successfully",
      data: orderTrackings,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch order trackings");
  }
};

/**
 * Get a single order tracking entry by ID
 */
export const getOrderTrackingsByOrderId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const orderId = idSchema.parse(req.params.orderId);
    const orderTracking = await orderTrackingService.getOrderTrackingsByOrderId(
      orderId
    );
    if (!orderTracking) {
      throw new Error("Order tracking not found");
    }
    res.json({
      success: true,
      message: "Order trackings fetched successfully",
      data: orderTracking,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch order tracking");
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
    const trackingId = idSchema.parse(req.params.id);
    const data = zUpdateOrderTrackingDto.parse(req.body);
    const updated = await orderTrackingService.updateOrderTracking(
      trackingId,
      data
    );
    res.json({
      success: true,
      message: "Order tracking updated successfully",
      data: updated,
    });
  } catch (error) {
    handleErrorResponse(error, res, "update order tracking");
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
    const trackingId = idSchema.parse(req.params.id);
    await orderTrackingService.deleteOrderTracking(trackingId);
    res.json({
      success: true,
      message: "Order tracking deleted successfully",
      data: null,
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete order tracking");
  }
};
