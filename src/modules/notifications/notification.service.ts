/**
 * Service layer for Notification entity operations.
 * Contains business logic and database interactions for notifications.
 */

import prisma from "@/prisma-client/prismaClient";
import { Notification, NotificationStatus } from "@/generated/prisma/client";
import {
  CreateNotificationDto,
  UpdateNotificationDto,
} from "@/modules/notifications/notification.dto";
import { getErrorMessage } from "@/utils/errorHandler";
import { getSocketId, io } from "@/utils/socket";
import { AppError } from "@/utils/appError";
import httpStatus from "http-status";

interface GetUserNotificationResult {
  notifications: Notification[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  unreadNotificationsCount: number;
}

/**
 * Create a new notification
 */
export async function createNotification(
  data: CreateNotificationDto
): Promise<Notification> {
  try {
    const receiver = await prisma.user.findUnique({
      where: { userId: data.receiverId },
    });
    if (!receiver) {
      throw new Error("Receiver not found");
    }

    const notification = await prisma.notification.create({
      data: {
        message: data.message,
        receiverId: data.receiverId,
      },
    });
    const receiverId = getSocketId(String(data.receiverId));
    if (receiverId) {
      io.to(receiverId).emit("newNotification", notification);
    }
    return notification;
  } catch (error) {
    throw new Error(`Failed to create notification: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieve all notifications
 */
export async function getAllNotifications(): Promise<Notification[]> {
  try {
    const notifications = await prisma.notification.findMany();
    return notifications;
  } catch (error) {
    throw new Error(`Failed to fetch notifications: ${getErrorMessage(error)}`);
  }
}
/**
 * Retrieve a user's notifications
 */
export async function getUserNotifications(
  userId: BigInt,
  paginationParams: { page: number; limit: number; skip: number; sort: string }
): Promise<GetUserNotificationResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { userId: Number(userId) },
    });
    if (!user) {
      throw new Error("User not found");
    }
    const notifications = await prisma.notification.findMany({
      where: { receiverId: Number(userId) },
      take: paginationParams.limit,
      skip: paginationParams.skip,
      orderBy: {
        createdAt: paginationParams.sort === "asc" ? "asc" : "desc",
      },
    });
    const totalNotifications = await prisma.notification.count({
      where: { receiverId: Number(userId) },
    });
    const unreadNotificationsCount = await prisma.notification.count({
      where: {
        receiverId: Number(userId),
        status: "UNREAD",
      },
    });
    return {
      notifications,
      currentPage: paginationParams.page,
      totalPages: Math.ceil(totalNotifications / paginationParams.limit),
      totalCount: totalNotifications,
      unreadNotificationsCount,
    };
  } catch (error) {
    throw new Error(`Failed to fetch notifications: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieve a notification by its ID
 */
export async function getNotificationById(
  notificationId: BigInt
): Promise<Notification | null> {
  try {
    const notification = await prisma.notification.findUnique({
      where: { notificationId: Number(notificationId) },
    });
    return notification;
  } catch (error) {
    throw new Error(`Failed to fetch notification: ${getErrorMessage(error)}`);
  }
}

/**
 * Update a notification by its ID
 */
export async function updateNotification(
  notificationId: BigInt,
  data: UpdateNotificationDto
): Promise<Notification> {
  try {
    const notification = await prisma.notification.findUnique({
      where: { notificationId: Number(notificationId) },
    });
    if (!notification) {
      throw new Error("Notification not found");
    }

    const updatedNotification = await prisma.notification.update({
      where: { notificationId: Number(notificationId) },
      data: {
        message: data.message,
      },
    });

    const receiverId = getSocketId(String(notification.receiverId));
    if (receiverId) {
      io.to(receiverId).emit("notificationUpdated", notification);
    }
    return updatedNotification;
  } catch (error) {
    throw new Error(`Failed to update notification: ${getErrorMessage(error)}`);
  }
}

/**
 * Delete a notification by its ID
 */
export async function deleteNotification(
  notificationId: BigInt
): Promise<void> {
  try {
    const notification = await prisma.notification.findUnique({
      where: { notificationId: Number(notificationId) },
    });
    if (!notification) {
      throw new Error("Notification not found");
    }
    await prisma.notification.delete({
      where: { notificationId: Number(notificationId) },
    });
    const receiverId = getSocketId(String(notification.receiverId));
    if (receiverId) {
      io.to(receiverId).emit("notificationDeleted", notification);
    }
  } catch (error) {
    throw new Error(`Failed to delete notification: ${getErrorMessage(error)}`);
  }
}
/**
 * Mark single unread notifications as read for specific user
 */

export async function markNotificationAsReadById(
  userId: BigInt,
  notificationId: BigInt
): Promise<void> {
  try {
    const notification = await prisma.notification.findUnique({
      where: {
        notificationId: Number(notificationId),
      },
    });
    if (!notification) {
      throw new AppError("Notification not found", httpStatus.NOT_FOUND);
    }
    await prisma.notification.update({
      where: {
        notificationId: Number(notificationId),
      },
      data: {
        status: NotificationStatus.READ,
      },
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Mark all unread notifications as read for specific user
 */

export async function markAllNotificationsAsRead(
  userId: BigInt
): Promise<void> {
  try {
    await prisma.notification.updateMany({
      where: {
        receiverId: Number(userId),
        status: NotificationStatus.UNREAD,
      },
      data: {
        status: NotificationStatus.READ,
      },
    });
  } catch (error) {
    throw new Error(
      `Failed to mark notifications as read: ${getErrorMessage(error)}`
    );
  }
}
