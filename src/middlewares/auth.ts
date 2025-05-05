// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { auth } from "../config/firebase";
import { PrismaClient } from "../generated/prisma/client"; // Adjust path
import { AdminRole } from "@prisma/client";

interface AuthRequest extends Request {
  user?: {
    firebase: admin.auth.DecodedIdToken;
    admin?: any;
    customer?: any;
  };
}

const prisma = new PrismaClient();

export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);

    // Check if user is Admin or Customer
    const admin = await prisma.admin.findUnique({
      where: { firebaseUid: decodedToken.uid },
    });

    const customer = await prisma.customer.findUnique({
      where: { firebaseUid: decodedToken.uid },
    });

    if (!admin && !customer) {
      return res.status(404).json({ error: "User not found" });
    }

    req.user = {
      firebase: decodedToken,
      admin,
      customer,
    };
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

export const restrictToAdminRole = (allowedRoles: AdminRole[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.admin) {
      return res.status(403).json({ error: "Forbidden: Not an admin" });
    }

    if (!allowedRoles.includes(req.user.admin.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient role" });
    }

    next();
  };
};

export const restrictToCustomer = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.user.customer) {
    return res.status(403).json({ error: "Forbidden: Not a customer" });
  }
  next();
};
