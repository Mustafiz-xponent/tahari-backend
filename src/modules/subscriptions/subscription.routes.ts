/**
 * Routes for Subscription entity operations.
 * Defines API endpoints for subscription-related CRUD operations.
 */

import { Router } from "express";
import * as SubscriptionController from "@/modules/subscriptions/subscription.controller";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import validator from "@/middlewares/validator";
import { zCreateSubscriptionDto } from "@/modules/subscriptions/subscription.dto";

const router = Router();

// Route to create a new subscription
router.post(
  "/",
  authMiddleware,
  authorizeRoles("CUSTOMER"),
  validator(zCreateSubscriptionDto),
  SubscriptionController.createSubscription
);
router.get(
  "/user",
  authMiddleware,
  authorizeRoles("CUSTOMER"),
  SubscriptionController.getUserSubscriptions
);

// Route to get all subscriptions
router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  SubscriptionController.getAllSubscriptions
);

// Route to get a subscription by ID
router.get("/:id", authMiddleware, SubscriptionController.getSubscriptionById);

// Route to update a subscription's details
router.put("/:id", authMiddleware, SubscriptionController.updateSubscription);

// Route to delete a subscription
router.delete(
  "/:id",
  authMiddleware,
  SubscriptionController.deleteSubscription
);

export default router;
