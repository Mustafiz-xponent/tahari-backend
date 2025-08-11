/**
 * Controller layer for SubscriptionPlan entity operations.
 * Handles HTTP requests and responses for subscription plan-related endpoints.
 */

import { Request, Response } from "express";
import * as subscriptionPlanService from "@/modules/subscription_plans/subscription_plan.service";
import {
  zCreateSubscriptionPlanDto,
  zUpdateSubscriptionPlanDto,
} from "@/modules/subscription_plans/subscription_plan.dto";
import { handleErrorResponse } from "@/utils/errorResponseHandler";
import { z } from "zod";
import httpStatus from "http-status";
import sendResponse from "@/utils/sendResponse";
import { SubscriptionPlan } from "@/generated/prisma/client";
const planIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Plan ID must be a positive integer",
});

/**
 * Create a new subscription plan
 */
export const createSubscriptionPlan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCreateSubscriptionPlanDto.parse(req.body);
    const plan = await subscriptionPlanService.createSubscriptionPlan(data);

    sendResponse<SubscriptionPlan>(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Subscription plan created successfully",
      data: plan,
    });
  } catch (error) {
    handleErrorResponse(error, res, "create subscription plan");
  }
};

/**
 * Get all subscription plans
 */
export const getAllSubscriptionPlans = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const plans = await subscriptionPlanService.getAllSubscriptionPlans();

    sendResponse<SubscriptionPlan[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Subscription plans retrived successfully",
      data: plans,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch subscription plans");
  }
};

/**
 * Get a single subscription plan by ID
 */
export const getSubscriptionPlanById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const planId = planIdSchema.parse(req.params.id);
    const plan = await subscriptionPlanService.getSubscriptionPlanById(planId);

    sendResponse<SubscriptionPlan>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Subscription plan retrived successfully",
      data: plan,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch subscription plan");
  }
};

/**
 * Update a subscription plan by ID
 */
export const updateSubscriptionPlan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const planId = planIdSchema.parse(req.params.id);
    const data = zUpdateSubscriptionPlanDto.parse(req.body);
    const updated = await subscriptionPlanService.updateSubscriptionPlan(
      planId,
      data
    );

    sendResponse<SubscriptionPlan>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Subscription plan updated successfully",
      data: updated,
    });
  } catch (error) {
    handleErrorResponse(error, res, "update subscription plan");
  }
};

/**
 * Delete a subscription plan by ID
 */
export const deleteSubscriptionPlan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const planId = planIdSchema.parse(req.params.id);
    await subscriptionPlanService.deleteSubscriptionPlan(planId);

    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Subscription plan deleted successfully",
      data: null,
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete subscription plan");
  }
};
