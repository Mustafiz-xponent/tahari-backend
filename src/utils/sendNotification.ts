import { NotificationType } from "@/generated/prisma/client";
import { Prisma } from "@prisma/client";
import { getOnlineSupportSockets, getSocketId, io } from "@/utils/socket";
import prisma from "@/prisma-client/prismaClient";

export const sendNotification = async (
  message: string,
  type: NotificationType,
  notify: "CUSTOMER" | "SUPPORT",
  userId?: bigint,
  tx?: Prisma.TransactionClient
) => {
  // pick transaction client if provided, otherwise use prisma
  const db = tx ?? prisma;
  const notification = await db.notification.create({
    data: {
      message: message.replace(/\s+/g, " ").trim(),
      receiverId: userId ? userId : null,
      type,
    },
  });
  if (notify === "CUSTOMER") {
    const receiverId = getSocketId(String(userId));
    if (receiverId) {
      io.to(receiverId).emit("newNotification", notification);
    }
  }
  if (notify === "SUPPORT") {
    // 🔥 Emit order notification to Admins/Support
    //     getOnlineSupportSockets().forEach((socketId) => {
    //       io.to(socketId).emit("newOrder", order);
    //     });
  }
};
