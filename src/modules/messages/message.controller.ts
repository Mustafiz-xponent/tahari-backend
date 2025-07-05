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
    res.status(201).json({ message: "Message created successfully", _message });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error creating message:", error);
    res.status(500).json({ message: "Failed to create message" });
  }
};

/**
 * Get all messages
 */
export const getAllMessages = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const messages = await messageService.getAllMessages();
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
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
      res.status(404).json({ message: "Message not found" });
      return;
    }
    res.json(message);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error fetching message:", error);
    res.status(500).json({ message: "Failed to fetch message" });
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
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error updating message:", error);
    res.status(500).json({ message: "Failed to update message" });
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
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Failed to delete message" });
  }
};
