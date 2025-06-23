/**
 * Controller layer for Order entity operations.
 * Handles HTTP requests and responses for order-related endpoints.
 */

import { Request, Response } from "express";
import * as orderService from "./orders.service";
import { zCreateOrderDto, zUpdateOrderDto } from "./orders.dto";
import { handleErrorResponse } from "../../utils/errorResponseHandler";
import { z } from "zod";

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
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    handleErrorResponse(error, res, "create order");
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
    res.json({
      success: true,
      message: "Orders fetched successfully",
      data: orders,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch orders");
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
      throw new Error("Order not found");
    }
    res.json({
      success: true,
      message: "Order fetched successfully",
      data: order,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch order");
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
    res.json({
      success: true,
      message: "Order updated successfully",
      data: updated,
    });
  } catch (error) {
    handleErrorResponse(error, res, "update order");
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
    res.json({
      success: true,
      message: "Order deleted successfully",
      data: null,
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete order");
  }
};
