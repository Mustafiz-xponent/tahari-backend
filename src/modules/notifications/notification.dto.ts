/**
 * Data Transfer Objects (DTOs) for the Notification entity
 * These interfaces define the expected shape of data when creating or updating a notification.
 */

import { z } from "zod";

const notificationStatusEnum = z.enum(["UNREAD", "READ"]);

/**
 * Zod schema for creating a new notification.
 */
export const zCreateNotificationDto = {
  body: z.object({
    message: z.string().min(1, "Message is required"),
    receiverId: z
      .union([z.string(), z.number()])
      .transform(BigInt)
      .refine((val) => val > 0n, {
        message: "Reciever ID must be a positive integer",
      }),
  }),
};

/**
 * TypeScript type inferred from create schema.
 */
export type CreateNotificationDto = z.infer<typeof zCreateNotificationDto.body>;

/**
 * Zod schema for updating a notification.
 */
export const zUpdateNotificationDto = {
  body: z.object({
    message: z.string().min(1, "Message is required").optional(),
  }),
  params: z.object({
    id: z
      .union([z.string(), z.number()])
      .transform(BigInt)
      .refine((val) => val > 0n, {
        message: "Params ID must be a positive integer",
      }),
  }),
};

/**
 * TypeScript type inferred from update schema.
 */
export type UpdateNotificationDto = z.infer<typeof zUpdateNotificationDto.body>;
