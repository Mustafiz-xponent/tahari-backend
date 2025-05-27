/**
 * Controller layer for SubscriptionDelivery entity operations.
 * Handles HTTP requests and responses for subscription delivery-related endpoints.
 */

import { Request, Response } from "express";
import * as subscriptionDeliveryService from "./subscription-delivery.service";
import {
  zCreateSubscriptionDeliveryDto,
  zUpdateSubscriptionDeliveryDto,
} from "./subscription-delivery.dto";
import { handleErrorResponse } from "../../utils/errorResponseHandler";
import { z } from "zod";

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
    res.status(201).json({
      success: true,
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
    res.json({
      success: true,
      message: "Subscription deliveries fetched successfully",
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
    res.json({
      success: true,
      message: "Subscription delivery fetched successfully",
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
    res.json({
      success: true,
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
    res.json({
      success: true,
      message: "Subscription delivery deleted successfully",
      data: null,
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete subscription delivery");
  }
};
