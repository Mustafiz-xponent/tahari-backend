/**
 * Routes for Subscription entity operations.
 * Defines API endpoints for subscription-related CRUD operations.
 */

import { Router } from "express";
import * as SubscriptionController from "@/modules/subscriptions/subscription.controller";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import validator from "@/middlewares/validator";
import {
  zCancelSubscriptionDto,
  zCreateSubscriptionDto,
  zGetSubscriptionDto,
  zPauseSubscriptionDto,
  zResumeSubscriptionDto,
} from "@/modules/subscriptions/subscription.dto";
import { UserRole } from "@/generated/prisma/client";

const router = Router();

// Route to create a new subscription
router.post(
  "/",
  authMiddleware,
  authorizeRoles(UserRole.CUSTOMER),
  validator(zCreateSubscriptionDto),
  SubscriptionController.createSubscription
);
// Route to get customer subscriptions
router.get(
  "/customer",
  authMiddleware,
  authorizeRoles(UserRole.CUSTOMER),
  SubscriptionController.getCustomerSubscriptions
);
// Route to pause a subscription
router.patch(
  "/pause/:id",
  authMiddleware,
  authorizeRoles(UserRole.CUSTOMER),
  validator(zPauseSubscriptionDto),
  SubscriptionController.pauseSubscription
);
// Route to resume a subscription
router.patch(
  "/resume/:id",
  authMiddleware,
  authorizeRoles(UserRole.CUSTOMER),
  validator(zResumeSubscriptionDto),
  SubscriptionController.resumeSubscription
);
// Route to cancel a subscription
router.patch(
  "/cancel/:id",
  authMiddleware,
  authorizeRoles(UserRole.CUSTOMER),
  validator(zCancelSubscriptionDto),
  SubscriptionController.cancelSubscription
);
// Route to get all subscriptions
router.get(
  "/",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  SubscriptionController.getAllSubscriptions
);

// Route to get a subscription by ID
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validator(zGetSubscriptionDto),
  SubscriptionController.getSubscriptionById
);

// Route to update a subscription's details
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  SubscriptionController.updateSubscription
);

// Route to delete a subscription
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  SubscriptionController.deleteSubscription
);

export default router;
