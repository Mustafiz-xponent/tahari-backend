/**
 * Controller layer for SubscriptionDelivery entity operations.
 * Handles HTTP requests and responses for subscription delivery-related endpoints.
 */

import { Request, Response } from "express";
import * as subscriptionDeliveryService from "@/modules/subscription_deliveries/subscription-delivery.service";
import {
  zCreateSubscriptionDeliveryDto,
  zUpdateSubscriptionDeliveryDto,
} from "@/modules/subscription_deliveries/subscription-delivery.dto";
import { handleErrorResponse } from "@/utils/errorResponseHandler";
import { z } from "zod";
import httpStatus from "http-status";
import sendResponse from "@/utils/sendResponse";
import { SubscriptionDelivery } from "@/generated/prisma/client";

const deliveryIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Delivery ID must be a positive integer",
});

/**
 * Create a new subscription delivery
 */
export const createSubscriptionDelivery = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCreateSubscriptionDeliveryDto.parse(req.body);
    const subscriptionDelivery =
      await subscriptionDeliveryService.createSubscriptionDelivery(data);

    sendResponse<SubscriptionDelivery>(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Subscription delivery created successfully",
      data: subscriptionDelivery,
    });
  } catch (error) {
    handleErrorResponse(error, res, "create subscription delivery");
  }
};

/**
 * Get all subscription deliveries
 */
export const getAllSubscriptionDeliveries = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const subscriptionDeliveries =
      await subscriptionDeliveryService.getAllSubscriptionDeliveries();

    sendResponse<SubscriptionDelivery[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Subscription deliveries retrieved successfully",
      data: subscriptionDeliveries,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch subscription deliveries");
  }
};

/**
 * Get a single subscription delivery by ID
 */
export const getSubscriptionDeliveryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const deliveryId = deliveryIdSchema.parse(req.params.id);
    const subscriptionDelivery =
      await subscriptionDeliveryService.getSubscriptionDeliveryById(deliveryId);
    if (!subscriptionDelivery) {
      throw new Error("Subscription delivery not found");
    }
    sendResponse<SubscriptionDelivery>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Subscription delivery retrieved successfully",
      data: subscriptionDelivery,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch subscription delivery");
  }
};

/**
 * Update a subscription delivery by ID
 */
export const updateSubscriptionDelivery = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const deliveryId = deliveryIdSchema.parse(req.params.id);
    const data = zUpdateSubscriptionDeliveryDto.parse(req.body);
    const updated =
      await subscriptionDeliveryService.updateSubscriptionDelivery(
        deliveryId,
        data
      );
    sendResponse<SubscriptionDelivery>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Subscription delivery updated successfully",
      data: updated,
    });
  } catch (error) {
    handleErrorResponse(error, res, "update subscription delivery");
  }
};

/**
 * Delete a subscription delivery by ID
 */
export const deleteSubscriptionDelivery = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const deliveryId = deliveryIdSchema.parse(req.params.id);
    await subscriptionDeliveryService.deleteSubscriptionDelivery(deliveryId);

    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Subscription delivery deleted successfully",
      data: null,
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete subscription delivery");
  }
};
