/**
 * Controller layer for OrderItem entity operations.
 * Handles HTTP requests and responses for order item-related endpoints.
 */

import { Request, Response } from "express";
import * as orderItemService from "./order-item.service";
import { zCreateOrderItemDto, zUpdateOrderItemDto } from "./order-item.dto";
import { handleErrorResponse } from "../../utils/errorResponseHandler";
import { z } from "zod";

const orderItemIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Order Item ID must be a positive integer",
});

/**
 * Create a new order item
 */
export const createOrderItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCreateOrderItemDto.parse(req.body);
    const orderItem = await orderItemService.createOrderItem(data);
    res.status(201).json({
      success: true,
      message: "Order item created successfully",
      data: orderItem,
    });
  } catch (error) {
    handleErrorResponse(error, res, "create order item");
  }
};

/**
 * Get all order items
 */
export const getAllOrderItems = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const orderItems = await orderItemService.getAllOrderItems();
    res.json({
      success: true,
      message: "Order items fetched successfully",
      data: orderItems,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch order items");
  }
};

/**
 * Get a single order item by ID
 */
export const getOrderItemById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const orderItemId = orderItemIdSchema.parse(req.params.id);
    const orderItem = await orderItemService.getOrderItemById(orderItemId);
    if (!orderItem) {
      throw new Error("Order item not found");
    }
    res.json({
      success: true,
      message: "Order item fetched successfully",
      data: orderItem,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch order item");
  }
};

/**
 * Update an order item by ID
 */
export const updateOrderItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const orderItemId = orderItemIdSchema.parse(req.params.id);
    const data = zUpdateOrderItemDto.parse(req.body);
    const updated = await orderItemService.updateOrderItem(orderItemId, data);
    res.json({
      success: true,
      message: "Order item updated successfully",
      data: updated,
    });
  } catch (error) {
    handleErrorResponse(error, res, "update order item");
  }
};

/**
 * Delete an order item by ID
 */
export const deleteOrderItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const orderItemId = orderItemIdSchema.parse(req.params.id);
    await orderItemService.deleteOrderItem(orderItemId);
    res.json({
      success: true,
      message: "Order item deleted successfully",
      data: null,
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete order item");
  }
};
