/**
 * Routes for SubscriptionPlan entity operations.
 * Defines API endpoints for subscription plan-related CRUD operations.
 */

import { Router } from "express";
import * as SubscriptionPlanController from "@/modules/subscription_plans/subscription_plan.controller";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";

const router = Router();

// Route to create a new subscription plan
router.post(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  SubscriptionPlanController.createSubscriptionPlan
);

// Route to get all subscription plans
router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "CUSTOMER", "SUPPORT"),
  SubscriptionPlanController.getAllSubscriptionPlans
);

// Route to get a subscription plan by ID
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "CUSTOMER", "SUPPORT"),
  SubscriptionPlanController.getSubscriptionPlanById
);

// Route to update a subscription plan's details
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  SubscriptionPlanController.updateSubscriptionPlan
);

// Route to delete a subscription plan
router.delete("/:id", SubscriptionPlanController.deleteSubscriptionPlan);

export default router;
