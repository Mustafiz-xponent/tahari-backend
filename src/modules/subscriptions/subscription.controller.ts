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
import { bigint, z } from "zod";
import httpStatus from "http-status";
import { SubscriptionStatus } from "@/generated/prisma/client";

const subscriptionIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Subscription ID must be a positive integer",
});
interface IQueryParams {
  page?: string;
  limit?: string;
  sort?: "asc" | "desc";
  status?: SubscriptionStatus;
}
/**
 * Create a new subscription
 */
export const createSubscription = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = req.body;
    const userId = req.user?.userId!;
    const subscription = await subscriptionService.createSubscription(
      userId,
      data
    );
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
    const subscriptionId = BigInt(req.params.id);
    const subscription = await subscriptionService.getSubscriptionById(
      subscriptionId
    );

    res.json({
      success: true,
      message: "Subscription retrived successfully",
      data: subscription,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch subscription");
  }
};
/**
 * Get users subscription
 */
export const getCustomerSubscriptions = async (
  req: Request<{}, {}, {}, IQueryParams>,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId!;
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit as string) || 10, 1),
      100
    ); // Max 100 items per page
    const skip = (page - 1) * limit;
    const sort = req.query.sort === "asc" ? "asc" : "desc";
    const status = req.query.status?.toUpperCase() as SubscriptionStatus;
    const paginationParams = { page, limit, skip, sort };
    const result = await subscriptionService.getCustomerSubscriptions(
      userId,
      paginationParams,
      status
    );

    res.json({
      success: true,
      message: "Subscription retrived successfully",
      data: result.subscriptions,
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
 * Pause customer subscription by Subscription Id
 */
export const pauseSubscription = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const subscriptionId = req.params.id;
    const userId = req.user?.userId;
    const subscription = await subscriptionService.pauseSubscription(
      BigInt(subscriptionId),
      userId
    );
    res.json({
      success: true,
      message: "Subscription paused successfully",
      data: subscription,
    });
  } catch (error) {
    handleErrorResponse(error, res, "pause subscription");
  }
};
/**
 * Cancel customer subscription by Subscription Id
 */
export const cancelSubscription = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const subscriptionId = req.params.id;
    const userId = req.user?.userId;
    const subscription = await subscriptionService.cancelSubscription(
      BigInt(subscriptionId),
      userId
    );
    res.json({
      success: true,
      message: "Subscription cancelled successfully",
      data: subscription,
    });
  } catch (error) {
    handleErrorResponse(error, res, "cancel subscription");
  }
};
/**
 * Resume customer subscription by Subscription Id
 */
export const resumeSubscription = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const subscriptionId = req.params.id;
    const userId = req.user?.userId;
    const subscription = await subscriptionService.resumeSubscription(
      BigInt(subscriptionId),
      userId
    );
    res.json({
      success: true,
      message: "Subscription resumed successfully",
      data: subscription,
    });
  } catch (error) {
    handleErrorResponse(error, res, "resume subscription");
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
