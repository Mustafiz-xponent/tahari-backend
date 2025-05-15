import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";

// Define the structure of your decoded JWT payload
interface JwtPayload {
  userId: string;
  email: string;
  role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
}

// Extend the Express Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = (
  role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN" | "SUPPORT"
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      if (decoded.role !== role) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }

      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: "Invalid token" });
    }
  };
};
