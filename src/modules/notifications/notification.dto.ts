/**
 * Data Transfer Objects (DTOs) for the Notification entity
 * These interfaces define the expected shape of data when creating or updating a notification.
 */

import { z } from "zod";

const notificationStatusEnum = z.enum(["unread", "read"]);

/**
 * Zod schema for creating a new notification.
 */
export const zCreateNotificationDto = z.object({
  message: z.string().min(1, "Message is required"),
  status: notificationStatusEnum.default("unread"),
});

/**
 * TypeScript type inferred from create schema.
 */
export type CreateNotificationDto = z.infer<typeof zCreateNotificationDto>;

/**
 * Zod schema for updating a notification.
 */
export const zUpdateNotificationDto = z.object({
  message: z.string().min(1, "Message is required").optional(),
  status: notificationStatusEnum.optional(),
});

/**
 * TypeScript type inferred from update schema.
 */
export type UpdateNotificationDto = z.infer<typeof zUpdateNotificationDto>;
