/**
 * Controller layer for OrderItem entity operations.
 * Handles HTTP requests and responses for order item-related endpoints.
 */

import { Request, Response } from "express";
import * as orderItemService from "@/modules/order_items/order-item.service";
import {
  zCreateOrderItemDto,
  zCreateOrderItemsDto,
  zUpdateOrderItemDto,
} from "@/modules/order_items/order-item.dto";
import { handleErrorResponse } from "@/utils/errorResponseHandler";
import { z } from "zod";
import httpStatus from "http-status";
import sendResponse from "@/utils/sendResponse";
import { OrderItem } from "@/generated/prisma/client";

const orderItemIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Order Item ID must be a positive integer",
});

export const createOrderItem = async (req: Request, res: Response) => {
  try {
    // Check if request is for multiple items
    if (req.body.items && Array.isArray(req.body.items)) {
      const data = zCreateOrderItemsDto.parse(req.body);
      const items = await orderItemService.createOrderItems(data);
      sendResponse<OrderItem[]>(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: `Created ${items.length} order items`,
        data: items,
      });
    }
    // Handle single item creation
    else {
      const data = zCreateOrderItemDto.parse(req.body);
      const item = await orderItemService.createOrderItem(data);
      sendResponse<OrderItem>(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Order item created successfully",
        data: item,
      });
    }
  } catch (error) {
    handleErrorResponse(error, res, "create order item(s)");
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
    sendResponse<OrderItem[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Order items retrieved successfully",
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
    sendResponse<OrderItem>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Order item retrieved successfully",
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
    sendResponse<OrderItem>(res, {
      success: true,
      statusCode: httpStatus.OK,
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
    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Order item deleted successfully",
      data: null,
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete order item");
  }
};
