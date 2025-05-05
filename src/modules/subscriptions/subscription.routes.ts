/**
 * Routes for Subscription entity operations.
 * Defines API endpoints for subscription-related CRUD operations.
 */

import { Router } from "express";
import * as SubscriptionController from "./subscription.controller";

const router = Router();

// Route to create a new subscription
router.post("/", SubscriptionController.createSubscription);

// Route to get all subscriptions
router.get("/", SubscriptionController.getAllSubscriptions);

// Route to get a subscription by ID
router.get("/:id", SubscriptionController.getSubscriptionById);

// Route to update a subscription's details
router.put("/:id", SubscriptionController.updateSubscription);

// Route to delete a subscription
router.delete("/:id", SubscriptionController.deleteSubscription);

export default router;
