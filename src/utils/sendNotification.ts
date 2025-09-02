import { getOnlineAdminSupportSockets, getSocketId, io } from "@/utils/socket";
import { NotificationType } from "@/generated/prisma/client";
import prisma from "@/prisma-client/prismaClient";
import { Prisma } from "@prisma/client";

export const sendNotification = async (
  message: string,
  type: NotificationType,
  notify: "CUSTOMER" | "ADMIN_SUPPORT",
  receiverId?: bigint | null,
  tx?: Prisma.TransactionClient
) => {
  // pick transaction client if provided, otherwise use prisma
  const db = tx ?? prisma;
  const notification = await db.notification.create({
    data: {
      message: message.replace(/\s+/g, " ").trim(),
      receiverId: receiverId ? receiverId : null,
      type,
    },
  });
  if (notify === "CUSTOMER") {
    const receiverSocketId = getSocketId(String(receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newNotification", notification);
    }
  }

  if (notify === "ADMIN_SUPPORT") {
    getOnlineAdminSupportSockets().forEach((socketId) => {
      io.to(socketId).emit("newNotification", notification);
    });
  }
};
