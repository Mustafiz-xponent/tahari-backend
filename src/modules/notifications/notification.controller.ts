/**
 * Controller layer for Notification entity operations.
 * Handles HTTP requests and responses for notification-related endpoints.
 */

import { Request, Response } from "express";
import * as notificationService from "./notification.service";
import {
  zCreateNotificationDto,
  zUpdateNotificationDto,
} from "./notification.dto";
import { ZodError, z } from "zod";

const notificationIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Notification ID must be a positive integer",
});

/**
 * Create a new notification
 */
export const createNotification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCreateNotificationDto.parse(req.body);
    const notification = await notificationService.createNotification(data);
    res
      .status(201)
      .json({ message: "Notification created successfully", notification });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Failed to create notification" });
  }
};

/**
 * Get all notifications
 */
export const getAllNotifications = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const notifications = await notificationService.getAllNotifications();
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

/**
 * Get a single notification by ID
 */
export const getNotificationById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const notificationId = notificationIdSchema.parse(req.params.id);
    const notification = await notificationService.getNotificationById(
      notificationId
    );
    if (!notification) {
      res.status(404).json({ message: "Notification not found" });
      return;
    }
    res.json(notification);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error fetching notification:", error);
    res.status(500).json({ message: "Failed to fetch notification" });
  }
};

/**
 * Update a notification by ID
 */
export const updateNotification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const notificationId = notificationIdSchema.parse(req.params.id);
    const data = zUpdateNotificationDto.parse(req.body);
    const updated = await notificationService.updateNotification(
      notificationId,
      data
    );
    res.json({
      message: "Notification updated successfully",
      notification: updated,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error updating notification:", error);
    res.status(500).json({ message: "Failed to update notification" });
  }
};

/**
 * Delete a notification by ID
 */
export const deleteNotification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const notificationId = notificationIdSchema.parse(req.params.id);
    await notificationService.deleteNotification(notificationId);
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
};
