/**
 * Routes for Notification entity operations.
 * Defines API endpoints for notification-related CRUD operations.
 */

import { Router } from "express";
import * as NotificationController from "./notification.controller";

const router = Router();

// Route to create a new notification
router.post("/", NotificationController.createNotification);

// Route to get all notifications
router.get("/", NotificationController.getAllNotifications);

// Route to get a notification by ID
router.get("/:id", NotificationController.getNotificationById);

// Route to update a notification's details
router.put("/:id", NotificationController.updateNotification);

// Route to delete a notification
router.delete("/:id", NotificationController.deleteNotification);

export default router;
