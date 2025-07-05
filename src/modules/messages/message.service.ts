/**
 * Service layer for Message entity operations.
 * Contains business logic and database interactions for messages.
 */

import prisma from "@/prisma-client/prismaClient";
import { Message } from "@/generated/prisma/client";
import {
  CreateMessageDto,
  UpdateMessageDto,
} from "@/modules/messages/message.dto";
import { getErrorMessage } from "@/utils/errorHandler";

/**
 * Create a new message
 */
export async function createMessage(data: CreateMessageDto): Promise<Message> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { customerId: data.customerId },
    });
    if (!customer) {
      throw new Error("Customer not found");
    }

    const message = await prisma.message.create({
      data: {
        subject: data.subject,
        message: data.message,
        customerId: data.customerId,
      },
    });
    return message;
  } catch (error) {
    throw new Error(`Failed to create message: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieve all messages
 */
export async function getAllMessages(): Promise<Message[]> {
  try {
    const messages = await prisma.message.findMany();
    return messages;
  } catch (error) {
    throw new Error(`Failed to fetch messages: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieve a message by its ID
 */
export async function getMessageById(
  messageId: BigInt
): Promise<Message | null> {
  try {
    const message = await prisma.message.findUnique({
      where: { messageId: Number(messageId) },
    });
    return message;
  } catch (error) {
    throw new Error(`Failed to fetch message: ${getErrorMessage(error)}`);
  }
}

/**
 * Update a message by its ID
 */
export async function updateMessage(
  messageId: BigInt,
  data: UpdateMessageDto
): Promise<Message> {
  try {
    if (data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { customerId: data.customerId },
      });
      if (!customer) {
        throw new Error("Customer not found");
      }
    }

    const message = await prisma.message.update({
      where: { messageId: Number(messageId) },
      data: {
        subject: data.subject,
        message: data.message,
        customerId: data.customerId,
      },
    });
    return message;
  } catch (error) {
    throw new Error(`Failed to update message: ${getErrorMessage(error)}`);
  }
}

/**
 * Delete a message by its ID
 */
export async function deleteMessage(messageId: BigInt): Promise<void> {
  try {
    await prisma.message.delete({
      where: { messageId: Number(messageId) },
    });
  } catch (error) {
    throw new Error(`Failed to delete message: ${getErrorMessage(error)}`);
  }
}
