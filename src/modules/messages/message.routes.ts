/**
 * Routes for Message entity operations.
 * Defines API endpoints for message-related CRUD operations.
 */

import { Router } from "express";
import * as MessageController from "@/modules/messages/message.controller";

const router = Router();

// Route to create a new message
router.post("/", MessageController.createMessage);

// Route to get all messages
router.get("/", MessageController.getAllMessages);

// Route to get a message by ID
router.get("/:id", MessageController.getMessageById);

// Route to update a message's details
router.put("/:id", MessageController.updateMessage);

// Route to delete a message
router.delete("/:id", MessageController.deleteMessage);

export default router;
