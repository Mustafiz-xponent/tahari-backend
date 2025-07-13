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
  zMarkNotificationAsReadDto,
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

// Route to get user notification
router.get(
  "/user",
  authMiddleware,
  authorizeRoles("CUSTOMER"),
  NotificationController.getUserNotifications
);

// Route to mark all notifications as read
router.patch(
  "/read/all",
  authMiddleware,
  authorizeRoles("CUSTOMER", "ADMIN", "SUPER_ADMIN"),
  NotificationController.markAllNotificationsAsRead
);
// Route to mark single notifications as read
router.patch(
  "/read/:id",
  authMiddleware,
  authorizeRoles("CUSTOMER", "ADMIN", "SUPER_ADMIN"),
  validator(zMarkNotificationAsReadDto),
  NotificationController.markNotificationAsReadById
);
// Route to get a notification by ID
router.get("/:id", NotificationController.getNotificationById);

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

export default router;
