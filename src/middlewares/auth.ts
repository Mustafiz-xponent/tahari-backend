import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import prisma from "@/prisma-client/prismaClient";
import { UserRole } from "@/generated/prisma/client";
import { status } from "http-status";

// Auth middleware check if user is authenticated
export const authMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(status.UNAUTHORIZED).json({ message: "No token provided" });
    return;
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

  const user = await prisma.user.findUnique({
    where: {
      userId: Number(decoded.userId),
    },
  });

  if (!user) {
    res.status(status.UNAUTHORIZED).json({
      succes: false,
      message: "User no longer exists. Please login again.",
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
      res.status(403).json({
        success: false,
        message: "You are not permitted to access this resource",
      });
      return;
    }
    next();
  };
};
