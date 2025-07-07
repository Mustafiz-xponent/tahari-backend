/**
 * Routes for Message entity operations.
 * Defines API endpoints for message-related CRUD operations.
 */

import { Router } from "express";
import * as MessageController from "@/modules/messages/message.controller";
import validator from "@/middlewares/validator";
import {
  zMarkMessageAsReadDto,
  zSendMessageDto,
} from "@/modules/messages/message.dto";
import { authMiddleware } from "@/middlewares/auth";

const router = Router();

// Route to create a new message
router.post("/", MessageController.createMessage);

// Route to get all messages
router.get("/", authMiddleware, MessageController.getAllMessages);

// Route to get a message by ID
router.get("/:id", MessageController.getMessageById);

// Route to update a message's details
router.put("/:id", MessageController.updateMessage);

// Route to delete a message
router.delete("/:id", MessageController.deleteMessage);

// Route to send message
router.post(
  "/send",
  authMiddleware,
  validator(zSendMessageDto),
  MessageController.sendMessage
);
// Route to mark message as read
router.patch(
  "/read",
  authMiddleware,
  validator(zMarkMessageAsReadDto),
  MessageController.markMessageAsRead
);

export default router;
