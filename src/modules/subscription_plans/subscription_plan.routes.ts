/**
 * Routes for SubscriptionPlan entity operations.
 * Defines API endpoints for subscription plan-related CRUD operations.
 */

import { Router } from "express";
import * as SubscriptionPlanController from "./subscription_plan.controller";

const router = Router();

// Route to create a new subscription plan
router.post("/", SubscriptionPlanController.createSubscriptionPlan);

// Route to get all subscription plans
router.get("/", SubscriptionPlanController.getAllSubscriptionPlans);

// Route to get a subscription plan by ID
router.get("/:id", SubscriptionPlanController.getSubscriptionPlanById);

// Route to update a subscription plan's details
router.put("/:id", SubscriptionPlanController.updateSubscriptionPlan);

// Route to delete a subscription plan
router.delete("/:id", SubscriptionPlanController.deleteSubscriptionPlan);

export default router;
