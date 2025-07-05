/**
 * Controller layer for Subscription entity operations.
 * Handles HTTP requests and responses for subscription-related endpoints.
 */

import { Request, Response } from "express";
import * as subscriptionService from "@/modules/subscriptions/subscription.service";
import {
  zCreateSubscriptionDto,
  zUpdateSubscriptionDto,
} from "@/modules/subscriptions/subscription.dto";
import { handleErrorResponse } from "@/utils/errorResponseHandler";
import { z } from "zod";
import httpStatus from "http-status";

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
    res.status(httpStatus.CREATED).json({
      success: true,
      message: "Subscription created successfully",
      data: subscription,
    });
  } catch (error) {
    handleErrorResponse(error, res, "create subscription");
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
    res.json({
      success: true,
      message: "Subscriptions fetched successfully",
      data: subscriptions,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch subscriptions");
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
      throw new Error("Subscription not found");
    }
    res.json({
      success: true,
      message: "Subscription fetched successfully",
      data: subscription,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch subscription");
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
      success: true,
      message: "Subscription updated successfully",
      data: updated,
    });
  } catch (error) {
    handleErrorResponse(error, res, "update subscription");
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
    res.json({
      success: true,
      message: "Subscription deleted successfully",
      data: null,
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete subscription");
  }
};
