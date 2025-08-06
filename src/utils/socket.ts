import app from "@/app";
import http from "http";
import logger from "@/utils/logger";
import { Server as SocketIOServer } from "socket.io";
import { User, UserRole } from "@/generated/prisma/client";
import { authenticateSocket } from "@/middlewares/auth";

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
  transports: ["websocket"],
  pingInterval: 25000, // 25 seconds
  pingTimeout: 60000, // 60 seconds
});

// Track online users with their roles
const onlineUsers = new Map<string, { socketId: string; role: UserRole }>();

// Helper to get a specific user's socket ID
export function getSocketId(userId: string): string | null {
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
  logger.info(`User connected: ${user.name} (${user.userId}): ${socket.id}`);

  // Add user to online list with role
  onlineUsers.set(String(user.userId), {
    socketId: socket.id,
    role: user.role,
  });

  // Notify about online status change
  io.emit("onlineUsers", getAllOnlineUsers());

  socket.on("disconnect", (reasone) => {
    logger.info(
      `User disconnected: ${user.name} (${user.userId}): ${socket.id} Reasone: ${reasone}`
    );
    onlineUsers.delete(String(user.userId));
    io.emit("onlineUsers", getAllOnlineUsers());
  });
});

export { io, server };
