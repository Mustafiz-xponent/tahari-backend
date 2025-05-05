/**
 * Controller layer for SubscriptionPlan entity operations.
 * Handles HTTP requests and responses for subscription plan-related endpoints.
 */

import { Request, Response } from "express";
import * as subscriptionPlanService from "./subscription_plan.service";
import {
  zCreateSubscriptionPlanDto,
  zUpdateSubscriptionPlanDto,
} from "./subscription_plan.dto";
import { ZodError, z } from "zod";

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
    res
      .status(201)
      .json({ message: "Subscription plan created successfully", plan });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error creating subscription plan:", error);
    res.status(500).json({ message: "Failed to create subscription plan" });
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
    res.json(plans);
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    res.status(500).json({ message: "Failed to fetch subscription plans" });
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
    if (!plan) {
      res.status(404).json({ message: "Subscription plan not found" });
      return;
    }
    res.json(plan);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error fetching subscription plan:", error);
    res.status(500).json({ message: "Failed to fetch subscription plan" });
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
    res.json({
      message: "Subscription plan updated successfully",
      plan: updated,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error updating subscription plan:", error);
    res.status(500).json({ message: "Failed to update subscription plan" });
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
    res.json({ message: "Subscription plan deleted successfully" });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error deleting subscription plan:", error);
    res.status(500).json({ message: "Failed to delete subscription plan" });
  }
};
