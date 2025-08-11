/**
 * Controller layer for Message entity operations.
 * Handles HTTP requests and responses for message-related endpoints.
 */

import { Request, Response } from "express";
import * as messageService from "@/modules/messages/message.service";
import { zCreateMessageDto } from "@/modules/messages/message.dto";
import { ZodError, z } from "zod";
import httpStatus from "http-status";
import sendResponse from "@/utils/sendResponse";
import { Message } from "@/generated/prisma/client";

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
    const message = await messageService.createMessage(data);

    sendResponse<Message>(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Message created successfully",
      data: message,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(httpStatus.BAD_REQUEST).json({ errors: error.flatten() });
      return;
    }
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to create message",
      data: null,
    });
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
    sendResponse<Message[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
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
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch messages",
      data: null,
    });
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
    sendResponse<Message>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Message retrieved successfully",
      data: message,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(httpStatus.BAD_REQUEST).json({ errors: error.flatten() });
      return;
    }
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch message",
      data: null,
    });
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
    const messageId = req.params.id;
    const { message } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const updatedMessage = await messageService.updateMessage(
      BigInt(messageId),
      message,
      userId,
      userRole
    );
    sendResponse<Message>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Message updated successfully",
      data: updatedMessage,
    });
  } catch (error) {
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to update message",
      data: null,
    });
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
    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Message deleted successfully",
      data: null,
    });
  } catch (error) {
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to delete message",
      data: null,
    });
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
    sendResponse<Message>(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Message sent successfully",
      data: result,
    });
  } catch (error) {
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to send message",
      data: null,
    });
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
    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Message marked as read successfully",
      data: null,
    });
  } catch (error) {
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to mark message as read",
      data: null,
    });
  }
};
