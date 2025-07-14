/**
 * Data Transfer Objects (DTOs) for the Notification entity
 * These interfaces define the expected shape of data when creating or updating a notification.
 */

import { NotificationType } from "@/generated/prisma/client";
import { z } from "zod";
/**
 * Common ID schema: supports string/number -> BigInt and must be > 0.
 */
const zBigIntId = z
  .union([z.string(), z.number()])
  .transform(BigInt)
  .refine((val) => val > 0n, {
    message: "ID must be a positive integer",
  });
/**
 * Zod schema for creating a new notification.
 */
export const zCreateNotificationDto = {
  body: z.object({
    message: z.string().min(1, "Message is required"),
    receiverId: zBigIntId,
    type: z.nativeEnum(NotificationType, {
      errorMap: () => ({
        message:
          "Invalid notification type. Must be ORDER, PAYMENT, WALLET, etc.",
      }),
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
    type: z
      .nativeEnum(NotificationType, {
        errorMap: () => ({
          message:
            "Invalid notification type. Must be ORDER, PAYMENT, WALLET, etc.",
        }),
      })
      .optional(),
  }),
  params: z.object({
    id: zBigIntId,
  }),
};

/**
 * TypeScript type inferred from update schema.
 */
export type UpdateNotificationDto = z.infer<typeof zUpdateNotificationDto.body>;

export const zDeleteNotificationDto = {
  params: z.object({
    id: zBigIntId,
  }),
};
export const zMarkNotificationAsReadDto = {
  params: z.object({
    id: zBigIntId,
  }),
};
