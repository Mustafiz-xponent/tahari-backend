/**
 * Controller layer for Notification entity operations.
 * Handles HTTP requests and responses for notification-related endpoints.
 */

import { Request, Response } from "express";
import * as notificationService from "@/modules/notifications/notification.service";
import { ZodError, z } from "zod";
import httpStatus from "http-status";
import sendResponse from "@/utils/sendResponse";
import { Notification } from "@/generated/prisma/client";

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
    const { message, receiverId, type } = req.body;

    const notification = await notificationService.createNotification({
      message: message.replace(/\s+/g, " ").trim(),
      receiverId,
      type,
    });
    sendResponse<Notification>(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to create notification",
      data: null,
    });
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
    sendResponse<Notification[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Notifications retrieved successfully",
      data: notifications,
    });
  } catch (error) {
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch notifications",
      data: null,
    });
  }
};
/**
 * Get a user notification by userId
 */

export const getUserNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit as string) || 10, 1),
      100
    ); // Max 100 items per page
    const skip = (page - 1) * limit;
    const sort = req.query.sort === "asc" ? "asc" : "desc";
    const paginationParams = { page, limit, skip, sort };
    const result = await notificationService.getUserNotifications(
      BigInt(userId),
      paginationParams
    );
    sendResponse<Notification[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Notifications retrieved successfully",
      data: result.notifications,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalCount,
        itemsPerPage: limit,
        hasNextPage: page < result.totalPages,
        hasPreviousPage: page > 1,
      },
      meta: {
        unreadNotificationsCount: result.unreadNotificationsCount,
        unseenNotificationsCount: result.unseenNotificationsCount,
      },
    });
  } catch (error) {
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch notifications",
      data: null,
    });
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
      res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "Notification not found" });
      return;
    }
    sendResponse<Notification>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Notification retrieved successfully",
      data: notification,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(httpStatus.BAD_REQUEST).json({ errors: error.flatten() });
      return;
    }
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch notification",
      data: null,
    });
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
    const data = req.body;
    const notificationId = req.params.id;

    const updatedNotification = await notificationService.updateNotification(
      BigInt(notificationId),
      data
    );
    sendResponse<Notification>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Notification updated successfully",
      data: updatedNotification,
    });
  } catch (error) {
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to update notification",
      data: null,
    });
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
    const notificationId = req.params.id;
    await notificationService.deleteNotification(BigInt(notificationId));
    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Notification deleted successfully",
      data: null,
    });
  } catch (error) {
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to delete notification",
      data: null,
    });
  }
};
/**
 * Mark all notifications as read
 **/
export const markNotificationAsReadById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?.userId;
  const notificationId = req.params.id;
  await notificationService.markNotificationAsReadById(
    userId,
    BigInt(notificationId)
  );
  sendResponse<null>(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Notification marked as read",
    data: null,
  });
};

/**
 * Mark all notifications as read
 **/
export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    await notificationService.markAllNotificationsAsRead(userId);
    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All notifications marked as read",
      data: null,
    });
  } catch (error) {
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to mark notifications as read",
      data: null,
    });
  }
};

/**
 * Mark all notifications as seen
 **/
export const markAllNotificationsAsSeen = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    await notificationService.markAllNotificationsAsSeen(userId);
    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All notifications marked as seen",
      data: null,
    });
  } catch (error) {
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to mark notifications as seen",
      data: null,
    });
  }
};
