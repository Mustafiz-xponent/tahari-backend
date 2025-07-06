import { Server as SocketIOServer } from "socket.io";
import http from "http";
import { User, UserRole } from "@/generated/prisma/client";
import logger from "@/utils/logger";
import app from "@/app";
import { authenticateSocket } from "@/middlewares/auth";

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
  transports: ["websocket"],
});

// Track online users with their roles
const onlineUsers = new Map<string, { socketId: string; role: UserRole }>();

// Helper to get a specific user's socket ID
export function getReceiverSocketId(userId: string): string | null {
  return onlineUsers.get(userId)?.socketId || null;
}

// Helper to get all online support staff socket IDs
export function getOnlineSupportSockets(): string[] {
  const supportSockets: string[] = [];
  onlineUsers.forEach((userData) => {
    if (
      userData.role === UserRole.SUPPORT ||
      userData.role === UserRole.ADMIN ||
      userData.role === UserRole.SUPER_ADMIN
    ) {
      supportSockets.push(userData.socketId);
    }
  });
  return supportSockets;
}

// Helper to get all online users
export function getAllOnlineUsers(): string[] {
  return Array.from(onlineUsers.keys());
}

io.use(authenticateSocket);

io.on("connection", async (socket) => {
  const user = socket.user as User;
  logger.info(`User connected: ${user.phone} (${user.userId})`);

  // Add user to online list with role
  onlineUsers.set(String(user.userId), {
    socketId: socket.id,
    role: user.role,
  });

  // Notify about online status change
  io.emit("onlineUsers", getAllOnlineUsers());

  socket.on("disconnect", () => {
    logger.info(`User disconnected: ${user.phone} (${user.userId})`);
    onlineUsers.delete(String(user.userId));
    io.emit("onlineUsers", getAllOnlineUsers());
  });
});

export { io, server };
