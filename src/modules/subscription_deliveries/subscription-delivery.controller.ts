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
import { ZodError, z } from "zod";

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
    res
      .status(201)
      .json({
        message: "Subscription delivery created successfully",
        subscriptionDelivery,
      });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error creating subscription delivery:", error);
    res.status(500).json({ message: "Failed to create subscription delivery" });
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
    res.json(subscriptionDeliveries);
  } catch (error) {
    console.error("Error fetching subscription deliveries:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch subscription deliveries" });
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
      res.status(404).json({ message: "Subscription delivery not found" });
      return;
    }
    res.json(subscriptionDelivery);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error fetching subscription delivery:", error);
    res.status(500).json({ message: "Failed to fetch subscription delivery" });
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
      message: "Subscription delivery updated successfully",
      subscriptionDelivery: updated,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error updating subscription delivery:", error);
    res.status(500).json({ message: "Failed to update subscription delivery" });
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
    res.json({ message: "Subscription delivery deleted successfully" });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error deleting subscription delivery:", error);
    res.status(500).json({ message: "Failed to delete subscription delivery" });
  }
};
