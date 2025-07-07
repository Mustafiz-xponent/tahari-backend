/**
 * Service layer for Message entity operations.
 * Contains business logic and database interactions for messages.
 */

import prisma from "@/prisma-client/prismaClient";
import { Message, UserRole } from "@/generated/prisma/client";
import {
  CreateMessageDto,
  UpdateMessageDto,
} from "@/modules/messages/message.dto";
import { getErrorMessage } from "@/utils/errorHandler";
import {
  getOnlineSupportSockets,
  getReceiverSocketId,
  io,
} from "@/utils/socket";

type GetAllMessagesResult = {
  messages: Message[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

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
        // subject: data.subject,
        message: data.message,
        senderId: BigInt(customer.userId),
        // customerId: data.customerId,
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
export async function getAllMessages(
  userId: bigint | number,
  userRole: UserRole,
  paginationParams: { page: number; limit: number; skip: number; sort: string },
  receiverId?: string
): Promise<GetAllMessagesResult> {
  try {
    let messages: Message[] = [];
    let totalMessageCount: number = 0;
    // Customer send message to support team
    if (userRole === UserRole.CUSTOMER) {
      messages = await prisma.message.findMany({
        where: {
          OR: [{ senderId: BigInt(userId) }, { receiverId: BigInt(userId) }],
        },
        include: {
          sender: {
            select: {
              userId: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
          receiver: {
            select: {
              userId: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
        take: paginationParams.limit,
        skip: paginationParams.skip,
        orderBy: {
          createdAt: paginationParams.sort === "asc" ? "asc" : "desc",
        },
      });

      totalMessageCount = await prisma.message.count({
        where: {
          OR: [{ senderId: BigInt(userId) }, { receiverId: BigInt(userId) }],
        },
      });
    }
    // Support and Admin send message to customer--
    if (
      receiverId &&
      (userRole === UserRole.SUPPORT ||
        userRole === UserRole.ADMIN ||
        userRole === UserRole.SUPER_ADMIN)
    ) {
      messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: BigInt(receiverId) },
            { receiverId: BigInt(receiverId) },
          ],
        },
        include: {
          sender: {
            select: {
              userId: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
          receiver: {
            select: {
              userId: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
        take: paginationParams.limit,
        skip: paginationParams.skip,
        orderBy: {
          createdAt: paginationParams.sort === "asc" ? "asc" : "desc",
        },
      });

      totalMessageCount = await prisma.message.count({
        where: {
          OR: [
            { senderId: BigInt(receiverId) },
            { receiverId: BigInt(receiverId) },
          ],
        },
      });
    }
    return {
      messages,
      totalCount: totalMessageCount,
      totalPages: Math.ceil(totalMessageCount / paginationParams.limit),
      currentPage: paginationParams.page,
    };
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
        // subject: data.subject,
        message: data.message,
        // customerId: data.customerId,
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

interface SendMessagePayload {
  message: string;
  receiverId?: bigint | null;
  senderId: bigint;
  senderRole: UserRole;
}

export const sendMessage = async ({
  message,
  receiverId,
  senderId,
  senderRole,
}: SendMessagePayload) => {
  try {
    // Customer ➜ Support broadcast
    if (senderRole === UserRole.CUSTOMER && !receiverId) {
      const msg = await prisma.message.create({
        data: {
          message,
          senderId: BigInt(senderId),
        },
        include: {
          sender: {
            select: {
              userId: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
      });

      getOnlineSupportSockets().forEach((socketId) => {
        io.to(socketId).emit("newMessage", msg);
      });

      return { data: msg };
    }

    //  Support/Admin ➜ Customer direct message
    if (
      (senderRole === UserRole.SUPPORT ||
        senderRole === UserRole.ADMIN ||
        senderRole === UserRole.SUPER_ADMIN) &&
      receiverId
    ) {
      const receiver = await prisma.user.findUnique({
        where: { userId: Number(receiverId) },
      });

      if (!receiver || receiver.role !== UserRole.CUSTOMER) {
        throw new Error("Receiver is not a customer");
      }

      const msg = await prisma.message.create({
        data: {
          message,
          senderId: BigInt(senderId),
          receiverId: BigInt(receiverId),
        },
        include: {
          sender: {
            select: {
              userId: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
          receiver: {
            select: {
              userId: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
      });

      const customerSocket = getReceiverSocketId(String(receiverId));
      if (customerSocket) {
        io.to(customerSocket).emit("newMessage", msg);
      }

      getOnlineSupportSockets().forEach((socketId) => {
        io.to(socketId).emit("newMessage", msg);
      });

      return { data: msg };
    }
    return { data: null };
  } catch (error) {
    throw new Error(`Failed to send message: ${getErrorMessage(error)}`);
  }
};
