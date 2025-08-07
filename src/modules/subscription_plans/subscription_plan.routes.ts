/**
 * Routes for SubscriptionPlan entity operations.
 * Defines API endpoints for subscription plan-related CRUD operations.
 */

import { Router } from "express";
import * as SubscriptionPlanController from "@/modules/subscription_plans/subscription_plan.controller";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import { UserRole } from "@/generated/prisma/client";

const router = Router();

// Route to create a new subscription plan
router.post(
  "/",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  SubscriptionPlanController.createSubscriptionPlan
);

// Route to get all subscription plans
router.get("/", SubscriptionPlanController.getAllSubscriptionPlans);

// Route to get a subscription plan by ID
router.get("/:id", SubscriptionPlanController.getSubscriptionPlanById);

// Route to update a subscription plan's details
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  SubscriptionPlanController.updateSubscriptionPlan
);

// Route to delete a subscription plan
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  SubscriptionPlanController.deleteSubscriptionPlan
);

export default router;
