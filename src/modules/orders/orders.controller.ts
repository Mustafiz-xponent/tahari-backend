/**
 * Controller layer for Order entity operations.
 * Handles HTTP requests and responses for order-related endpoints.
 */

import { NextFunction, Request, Response } from "express";
import * as orderService from "./orders.service";
import { zCreateOrderDto, zUpdateOrderDto } from "./orders.dto";
import { handleErrorResponse } from "../../utils/errorResponseHandler";
import { z } from "zod";
import { OrderStatus } from "@/generated/prisma/client";

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
interface OrdersQuery {
  page?: string;
  limit?: string;
  status?: OrderStatus;
  customerId?: string;
  sort?: "asc" | "desc";
}
export const getAllOrders = async (
  req: Request<{}, {}, {}, OrdersQuery>,
  res: Response
): Promise<void> => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit as string) || 10, 1),
      100
    ); // Max 100 items per page
    const skip = (page - 1) * limit;
    const sort = req.query.sort === "asc" ? "asc" : "desc";

    const status = req.query.status as string | undefined;
    const customerId = req.query.customerId
      ? BigInt(req.query.customerId as string)
      : undefined;
    // TODO: add pagination & filter functionality

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
/**
 * Get all customer orders
 */
export const getCustomerOrders = async (
  req: Request<{}, {}, {}, OrdersQuery>,
  res: Response
): Promise<void> => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit as string) || 10, 1),
      100
    ); // Max 100 items per page
    const skip = (page - 1) * limit;
    const sort = req.query.sort === "asc" ? "asc" : "desc";
    const status = req.query.status as string | undefined;
    const statusArray = status
      ? Array.isArray(status)
        ? status.map((s) => s.toUpperCase())
        : status.split(",").map((s) => s.toUpperCase())
      : [];

    if (!req.user?.userId) throw new Error("Please login to continue");

    const userId = BigInt(req.user?.userId!);

    const result = await orderService.getCustomerOrders({
      userId,
      page,
      limit,
      sort,
      statusArray,
      skip,
    });

    res.status(200).json({
      success: true,
      message: "Customer orders fetched successfully",
      data: result.orders,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalCount,
        itemsPerPage: limit,
        hasNextPage: page < result.totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch customer orders");
  }
};
