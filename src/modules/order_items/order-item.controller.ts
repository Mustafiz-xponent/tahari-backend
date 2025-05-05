/**
 * Controller layer for OrderItem entity operations.
 * Handles HTTP requests and responses for order item-related endpoints.
 */

import { Request, Response } from "express";
import * as orderItemService from "./order-item.service";
import { zCreateOrderItemDto, zUpdateOrderItemDto } from "./order-item.dto";
import { ZodError, z } from "zod";

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
    res
      .status(201)
      .json({ message: "Order item created successfully", orderItem });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error creating order item:", error);
    res.status(500).json({ message: "Failed to create order item" });
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
    res.json(orderItems);
  } catch (error) {
    console.error("Error fetching order items:", error);
    res.status(500).json({ message: "Failed to fetch order items" });
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
      res.status(404).json({ message: "Order item not found" });
      return;
    }
    res.json(orderItem);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error fetching order item:", error);
    res.status(500).json({ message: "Failed to fetch order item" });
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
      message: "Order item updated successfully",
      orderItem: updated,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error updating order item:", error);
    res.status(500).json({ message: "Failed to update order item" });
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
    res.json({ message: "Order item deleted successfully" });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error deleting order item:", error);
    res.status(500).json({ message: "Failed to delete order item" });
  }
};
