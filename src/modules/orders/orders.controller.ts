/**
 * Controller layer for Order entity operations.
 * Handles HTTP requests and responses for order-related endpoints.
 */

import { Request, Response } from "express";
import * as orderService from "./order.service";
import { zCreateOrderDto, zUpdateOrderDto } from "./order.dto";
import { ZodError, z } from "zod";

const orderIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Order ID must be a positive integer",
});

/**
 * Create a new order
 */
export const createOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCreateOrderDto.parse(req.body);
    const order = await orderService.createOrder(data);
    res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Failed to create order" });
  }
};

/**
 * Get all orders
 */
export const getAllOrders = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const orders = await orderService.getAllOrders();
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/**
 * Get a single order by ID
 */
export const getOrderById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const orderId = orderIdSchema.parse(req.params.id);
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    res.json(order);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

/**
 * Update an order by ID
 */
export const updateOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const orderId = orderIdSchema.parse(req.params.id);
    const data = zUpdateOrderDto.parse(req.body);
    const updated = await orderService.updateOrder(orderId, data);
    res.json({ message: "Order updated successfully", order: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Failed to update order" });
  }
};

/**
 * Delete an order by ID
 */
export const deleteOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const orderId = orderIdSchema.parse(req.params.id);
    await orderService.deleteOrder(orderId);
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Failed to delete order" });
  }
};
