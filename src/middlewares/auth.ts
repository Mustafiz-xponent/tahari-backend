import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import prisma from "@/prisma-client/prismaClient";
import { UserRole } from "@/generated/prisma/client";
import { status } from "http-status";
import { User } from "@/generated/prisma/client";
import { Socket } from "socket.io";
import logger from "@/utils/logger";
import sendResponse from "@/utils/sendResponse";

// Auth middleware check if user is authenticated
export const authMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    sendResponse<null>(res, {
      success: false,
      statusCode: status.UNAUTHORIZED,
      message: "No token provided",
      data: null,
    });
    return;
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

  const user = await prisma.user.findUnique({
    where: {
      userId: Number(decoded.userId),
    },
  });

  if (!user) {
    sendResponse<null>(res, {
      success: false,
      statusCode: status.UNAUTHORIZED,
      message: "User no longer exists. Please login again.",
      data: null,
    });
    return;
  }

  req.user = user;
  next();
};

/*
 ** Check if user has the required role to access the resource. eg:authorizeRoles("role1", "role2")
 ** @param roles: List of roles that are allowed to access the resource
 */
export const authorizeRoles = (...roles: UserRole[]): RequestHandler => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role as UserRole)) {
      sendResponse<null>(res, {
        success: false,
        statusCode: status.FORBIDDEN,
        message: "You are not permitted to access this resource",
        data: null,
      });
      return;
    }
    next();
  };
};

// Middleware to authenticate JWT for WebSocket connections
export const authenticateSocket = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      throw new Error("Please login to access this resource.");
    }

    const decodedData = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: {
        userId: Number(decodedData.userId),
      },
    });
    if (!user) {
      throw new Error("Please login to access this resource.");
    }
    socket.user = user as User;
    logger.info(`Socket authenticated: ${user.name} (${user.userId})`);
    next();
  } catch (err: any) {
    logger.info(`Socket authentication failed: ${err.message}`);
    return next(err as Error);
  }
};
