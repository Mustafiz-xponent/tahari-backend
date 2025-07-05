/**
 * Routes for SubscriptionDelivery entity operations.
 * Defines API endpoints for subscription delivery-related CRUD operations.
 */

import { Router } from "express";
import * as SubscriptionDeliveryController from "@/modules/subscription_deliveries/subscription-delivery.controller";

const router = Router();

// Route to create a new subscription delivery
router.post("/", SubscriptionDeliveryController.createSubscriptionDelivery);

// Route to get all subscription deliveries
router.get("/", SubscriptionDeliveryController.getAllSubscriptionDeliveries);

// Route to get a subscription delivery by ID
router.get("/:id", SubscriptionDeliveryController.getSubscriptionDeliveryById);

// Route to update a subscription delivery's details
router.put("/:id", SubscriptionDeliveryController.updateSubscriptionDelivery);

// Route to delete a subscription delivery
router.delete(
  "/:id",
  SubscriptionDeliveryController.deleteSubscriptionDelivery
);

export default router;
