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
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit as string) || 10, 1),
      100
    ); // Max 100 items per page
    const skip = (page - 1) * limit;
    const sort = req.query.sort === "asc" ? "asc" : "desc";
    const paginationParams = { page, limit, skip, sort };

    const results = await messageService.getAllMessages(
      userId,
      userRole,
      paginationParams,
      receiverId
    );
    res.status(httpStatus.OK).json({
      success: true,
      message: "Messages retrieved successfully",
      data: results.messages,
      pagination: {
        currentPage: results.currentPage,
        totalPages: results.totalPages,
        totalItems: results.totalCount,
        itemsPerPage: limit,
        hasNextPage: page < results.totalPages,
        hasPreviousPage: page > 1,
      },
      meta: {
        unreadMessageCount: results.unreadMessageCount,
      },
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
    const messageId = req.params.id;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    await messageService.deleteMessage(BigInt(messageId), userId, userRole);
    res
      .status(httpStatus.OK)
      .json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
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
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to send message" });
  }
};
/**
 * Mark message as read
 */
export const markMessageAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const { senderId } = req.body;

    await messageService.markMessageAsRead({
      userId,
      userRole,
      senderId,
    });

    res.status(httpStatus.OK).json({
      success: true,
      message: "Message marked as read successfully",
    });
  } catch (error) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to mark message as read" });
  }
};
