/**
 * Controller layer for Message entity operations.
 * Handles HTTP requests and responses for message-related endpoints.
 */

import { Request, Response } from "express";
import * as messageService from "@/modules/messages/message.service";
import {
  zCreateMessageDto,
  zUpdateMessageDto,
} from "@/modules/messages/message.dto";
import { ZodError, z } from "zod";
import httpStatus from "http-status";
import {
  getOnlineSupportSockets,
  getReceiverSocketId,
  io,
} from "@/utils/socket";
import { UserRole } from "@/generated/prisma/client";
import prisma from "@/prisma-client/prismaClient";

const messageIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Message ID must be a positive integer",
});

/**
 * Create a new message
 */
export const createMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCreateMessageDto.parse(req.body);
    const _message = await messageService.createMessage(data);
    res
      .status(httpStatus.CREATED)
      .json({ message: "Message created successfully", _message });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(httpStatus.BAD_REQUEST).json({ errors: error.flatten() });
      return;
    }
    console.error("Error creating message:", error);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to create message" });
  }
};

/**
 * Get all messages
 */
export const getAllMessages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const receiverId = req.query?.receiverId as string;

    const messages = await messageService.getAllMessages(
      userId,
      userRole,
      receiverId
    );
    res.status(httpStatus.OK).json({
      success: true,
      message: "Messages fetched successfully",
      data: messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to fetch messages" });
  }
};

/**
 * Get a single message by ID
 */
export const getMessageById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const messageId = messageIdSchema.parse(req.params.id);
    const message = await messageService.getMessageById(messageId);
    if (!message) {
      res.status(httpStatus.NOT_FOUND).json({ message: "Message not found" });
      return;
    }
    res.json(message);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(httpStatus.BAD_REQUEST).json({ errors: error.flatten() });
      return;
    }
    console.error("Error fetching message:", error);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to fetch message" });
  }
};

/**
 * Update a message by ID
 */
export const updateMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const messageId = messageIdSchema.parse(req.params.id);
    const data = zUpdateMessageDto.parse(req.body);
    const updated = await messageService.updateMessage(messageId, data);
    res.json({ message: "Message updated successfully", data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(httpStatus.BAD_REQUEST).json({ errors: error.flatten() });
      return;
    }
    console.error("Error updating message:", error);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to update message" });
  }
};

/**
 * Delete a message by ID
 */
export const deleteMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const messageId = messageIdSchema.parse(req.params.id);
    await messageService.deleteMessage(messageId);
    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(httpStatus.BAD_REQUEST).json({ errors: error.flatten() });
      return;
    }
    console.error("Error deleting message:", error);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to delete message" });
  }
};

export const sendMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { message, receiverId } = req.body;
    const senderId = req.user?.userId;
    const senderRole = req.user?.role;

    const result = await messageService.sendMessage({
      message,
      receiverId,
      senderId,
      senderRole,
    });

    res.status(httpStatus.CREATED).json({
      message: "Message sent successfully",
      data: result.data,
    });
  } catch (error) {
    throw error;
  }
};
