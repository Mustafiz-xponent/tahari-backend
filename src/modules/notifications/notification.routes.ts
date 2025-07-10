/**
 * Routes for Notification entity operations.
 * Defines API endpoints for notification-related CRUD operations.
 */

import { Router } from "express";
import * as NotificationController from "@/modules/notifications/notification.controller";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import validator from "@/middlewares/validator";
import {
  zCreateNotificationDto,
  zDeleteNotificationDto,
  zUpdateNotificationDto,
} from "@/modules/notifications/notification.dto";

const router = Router();

// Route to create a new notification
router.post(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  validator(zCreateNotificationDto),
  NotificationController.createNotification
);

// Route to get all notifications
router.get("/", NotificationController.getAllNotifications);

// Route to get a notification by ID
router.get("/:id", NotificationController.getNotificationById);

// Route to get user notification
router.get(
  "/user",
  authMiddleware,
  authorizeRoles("CUSTOMER"),
  NotificationController.getUserNotifications
);

// Route to update a notification's details
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  validator(zUpdateNotificationDto),
  NotificationController.updateNotification
);

// Route to delete a notification
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("CUSTOMER", "ADMIN", "SUPER_ADMIN"),
  validator(zDeleteNotificationDto),
  NotificationController.deleteNotification
);

// Route to mark all notifications as read
router.put(
  "/read",
  authMiddleware,
  authorizeRoles("CUSTOMER", "ADMIN", "SUPER_ADMIN"),
  NotificationController.markAllNotificationsAsRead
);

export default router;
