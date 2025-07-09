/**
 * Service layer for Message entity operations.
 * Contains business logic and database interactions for messages.
 */

import prisma from "@/prisma-client/prismaClient";

import {
  CreateMessageDto,
  UpdateMessageDto,
} from "@/modules/messages/message.dto";
import { getErrorMessage } from "@/utils/errorHandler";
import { getOnlineSupportSockets, getSocketId, io } from "@/utils/socket";
import { UserRole, Message } from "@/generated/prisma/client";

type GetAllMessagesResult = {
  messages: Message[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  unreadMessageCount: number;
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
    let unreadMessageCount: number = 0;
    // Customer send message to support team
    if (userRole === UserRole.CUSTOMER) {
      const whereClause = {
        OR: [{ senderId: BigInt(userId) }, { receiverId: BigInt(userId) }],
      };
      messages = await prisma.message.findMany({
        where: whereClause,
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
        where: whereClause,
      });
      unreadMessageCount = await prisma.message.count({
        where: {
          ...whereClause,
          status: "UNREAD",
          receiverId: BigInt(userId),
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
      const whereClause = {
        OR: [
          { senderId: BigInt(receiverId) },
          { receiverId: BigInt(receiverId) },
        ],
      };
      messages = await prisma.message.findMany({
        where: whereClause,
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
        where: whereClause,
      });

      unreadMessageCount = await prisma.message.count({
        where: {
          ...whereClause,
          status: "UNREAD",
          senderId: BigInt(receiverId),
        },
      });
    }
    return {
      messages,
      totalCount: totalMessageCount,
      totalPages: Math.ceil(totalMessageCount / paginationParams.limit),
      currentPage: paginationParams.page,
      unreadMessageCount,
    };
  } catch (error) {
    console.log("ERROR:", error);
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
  messageId: bigint,
  newMessage: string,
  userId: bigint,
  userRole: UserRole
) {
  try {
    const message = await prisma.message.findUnique({
      where: { messageId: Number(messageId) },
    });

    if (!message) {
      throw new Error("Message not found");
    }

    if (userRole === UserRole.CUSTOMER) {
      if (message.senderId !== userId) {
        throw new Error("You can't update this message");
      }
    }

    const updatedMessage = await prisma.message.update({
      where: { messageId: Number(messageId) },
      data: { message: newMessage },
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

    const senderSocket = getSocketId(String(updatedMessage.senderId));
    const receiverSocket = updatedMessage.receiverId
      ? getSocketId(String(updatedMessage.receiverId))
      : null;

    if (senderSocket) {
      io.to(senderSocket).emit("messageUpdated", {
        message: updatedMessage,
      });
    }

    if (receiverSocket) {
      io.to(receiverSocket).emit("messageUpdated", {
        message: updatedMessage,
      });
    }

    getOnlineSupportSockets().forEach((socketId) => {
      io.to(socketId).emit("messageUpdated", {
        message: updatedMessage,
      });
    });

    return updatedMessage;
  } catch (error) {
    throw new Error(`Failed to update message: ${getErrorMessage(error)}`);
  }
}

/**
 * Delete a message by its ID
 */
export async function deleteMessage(
  messageId: BigInt,
  userId: bigint,
  userRole: UserRole
): Promise<void> {
  try {
    const message = await prisma.message.findUnique({
      where: { messageId: Number(messageId) },
    });

    if (!message) {
      throw new Error("Message not found");
    }
    // Permission check:
    if (userRole === UserRole.CUSTOMER) {
      // Customer can ONLY delete their own sent messages
      if (message.senderId !== BigInt(userId)) {
        throw new Error("You can't delete this message");
      }
    }
    const deletedMessage = await prisma.message.delete({
      where: { messageId: Number(messageId) },
    });
    const senderSocket = getSocketId(String(deletedMessage.senderId));
    const receiverSocket = deletedMessage.receiverId
      ? getSocketId(String(deletedMessage.receiverId))
      : null;

    if (senderSocket) {
      io.to(senderSocket).emit("messageDeleted", {
        messageId: deletedMessage.messageId,
      });
    }
    if (receiverSocket) {
      io.to(receiverSocket).emit("messageDeleted", {
        messageId: deletedMessage.messageId,
      });
    }
    getOnlineSupportSockets().forEach((socketId) => {
      io.to(socketId).emit("messageDeleted", {
        messageId: deletedMessage.messageId,
      });
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
      const customerSocket = getSocketId(String(senderId));
      if (customerSocket) {
        io.to(customerSocket).emit("newMessage", msg);
      }

      return { data: msg };
    }

    //  Support/Admin/SuperAdmin --> Customer direct message
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

      const customerSocket = getSocketId(String(receiverId));
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
/**
 * mark unread message as read
 **/
export const markMessageAsRead = async ({
  userId,
  userRole,
  senderId,
}: {
  userId: bigint | number;
  userRole: UserRole;
  senderId: bigint | number;
}) => {
  try {
    const now = new Date();
    let whereClause = {};

    if (
      userRole === UserRole.SUPPORT ||
      userRole === UserRole.ADMIN ||
      userRole === UserRole.SUPER_ADMIN
    ) {
      // Support reading customer-sent messages
      whereClause = {
        senderId: BigInt(senderId), // FROM customer
        receiverId: null,
        status: "UNREAD",
      };
    } else if (userRole === UserRole.CUSTOMER) {
      // Customer reading support-sent messages
      whereClause = {
        sender: {
          role: {
            in: ["SUPPORT", "ADMIN", "SUPER_ADMIN"],
          },
        },
        receiverId: BigInt(userId),
        status: "UNREAD",
      };
    } else {
      throw new Error("Invalid role");
    }

    await prisma.message.updateMany({
      where: whereClause,
      data: {
        status: "READ",
        readAt: now,
      },
    });
  } catch (error) {
    throw new Error(
      `Failed to mark message as read: ${getErrorMessage(error)}`
    );
  }
};
