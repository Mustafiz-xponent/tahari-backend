/**
 * Controller layer for Subscription entity operations.
 * Handles HTTP requests and responses for subscription-related endpoints.
 */

import { Request, Response } from "express";
import * as subscriptionService from "./subscription.service";
import {
  zCreateSubscriptionDto,
  zUpdateSubscriptionDto,
} from "./subscription.dto";
import { ZodError, z } from "zod";

const subscriptionIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Subscription ID must be a positive integer",
});

/**
 * Create a new subscription
 */
export const createSubscription = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCreateSubscriptionDto.parse(req.body);
    const subscription = await subscriptionService.createSubscription(data);
    res
      .status(201)
      .json({ message: "Subscription created successfully", subscription });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error creating subscription:", error);
    res.status(500).json({ message: "Failed to create subscription" });
  }
};

/**
 * Get all subscriptions
 */
export const getAllSubscriptions = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const subscriptions = await subscriptionService.getAllSubscriptions();
    res.json(subscriptions);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ message: "Failed to fetch subscriptions" });
  }
};

/**
 * Get a single subscription by ID
 */
export const getSubscriptionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const subscriptionId = subscriptionIdSchema.parse(req.params.id);
    const subscription = await subscriptionService.getSubscriptionById(
      subscriptionId
    );
    if (!subscription) {
      res.status(404).json({ message: "Subscription not found" });
      return;
    }
    res.json(subscription);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error fetching subscription:", error);
    res.status(500).json({ message: "Failed to fetch subscription" });
  }
};

/**
 * Update a subscription by ID
 */
export const updateSubscription = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const subscriptionId = subscriptionIdSchema.parse(req.params.id);
    const data = zUpdateSubscriptionDto.parse(req.body);
    const updated = await subscriptionService.updateSubscription(
      subscriptionId,
      data
    );
    res.json({
      message: "Subscription updated successfully",
      subscription: updated,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error updating subscription:", error);
    res.status(500).json({ message: "Failed to update subscription" });
  }
};

/**
 * Delete a subscription by ID
 */
export const deleteSubscription = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const subscriptionId = subscriptionIdSchema.parse(req.params.id);
    await subscriptionService.deleteSubscription(subscriptionId);
    res.json({ message: "Subscription deleted successfully" });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error deleting subscription:", error);
    res.status(500).json({ message: "Failed to delete subscription" });
  }
};
