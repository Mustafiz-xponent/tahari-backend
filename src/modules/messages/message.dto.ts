/**
 * Data Transfer Objects (DTOs) for the Message entity
 * These interfaces define the expected shape of data when creating or updating a message.
 */

import { z } from "zod";

/**
 * Zod schema for creating a new message.
 */
export const zCreateMessageDto = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  customerId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Customer ID must be a positive integer",
    }),
});

/**
 * TypeScript type inferred from create schema.
 */
export type CreateMessageDto = z.infer<typeof zCreateMessageDto>;

/**
 * Zod schema for updating a message.
 */
export const zUpdateMessageDto = z.object({
  subject: z.string().min(1, "Subject is required").optional(),
  message: z.string().min(1, "Message is required").optional(),
  customerId: z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: "Customer ID must be a positive integer",
    })
    .optional(),
});

/**
 * TypeScript type inferred from update schema.
 */
export type UpdateMessageDto = z.infer<typeof zUpdateMessageDto>;

/**
 * Zod schema for creating a new message.
 */
export const zSendMessageDto = {
  body: z.object({
    message: z.string().min(1, "Message is required"),
    receiverId: z
      .union([z.string(), z.number()])
      .transform(BigInt)
      .refine((val) => val > 0n, {
        message: "Receiver ID must be a positive integer",
      })
      .optional(),
  }),
};

export type SendMessageDto = z.infer<typeof zSendMessageDto.body>;

export const zMarkMessageAsReadDto = {
  body: z.object({
    senderId: z
      .union([z.string(), z.number()])
      .transform(BigInt)
      .refine((val) => val > 0n, {
        message: "Sender ID must be a positive integer",
      }),
  }),
};

export type MarkMessageAsReadDto = z.infer<typeof zMarkMessageAsReadDto.body>;
