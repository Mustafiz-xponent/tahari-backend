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

const router = Router();

// Route to create a new subscription
router.post(
  "/",
  authMiddleware,
  authorizeRoles("CUSTOMER"),
  validator(zCreateSubscriptionDto),
  SubscriptionController.createSubscription
);
// Route to get customer subscriptions
router.get(
  "/customer",
  authMiddleware,
  authorizeRoles("CUSTOMER"),
  SubscriptionController.getCustomerSubscriptions
);
// Route to pause a subscription
router.patch(
  "/pause/:id",
  authMiddleware,
  authorizeRoles("CUSTOMER"),
  validator(zPauseSubscriptionDto),
  SubscriptionController.pauseSubscription
);
// Route to resume a subscription
// router.patch(
// "/resume/:id",
// authMiddleware,
// authorizeRoles("CUSTOMER"),
// validator(zResumeSubscriptionDto),
// SubscriptionController.resumeSubscription
// );
// Route to cancel a subscription
router.patch(
  "/cancel/:id",
  authMiddleware,
  authorizeRoles("CUSTOMER"),
  validator(zCancelSubscriptionDto),
  SubscriptionController.cancelSubscription
);
// Route to get all subscriptions
router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  SubscriptionController.getAllSubscriptions
);

// Route to get a subscription by ID
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("CUSTOMER", "ADMIN", "SUPER_ADMIN"),
  validator(zGetSubscriptionDto),
  SubscriptionController.getSubscriptionById
);

// Route to update a subscription's details
router.put("/:id", authMiddleware, SubscriptionController.updateSubscription);

// Route to delete a subscription
router.delete(
  "/:id",
  authMiddleware,
  SubscriptionController.deleteSubscription
);

export default router;
