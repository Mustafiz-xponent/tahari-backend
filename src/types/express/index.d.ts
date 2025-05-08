// src/types/express/index.d.ts

import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
      };
    }
  }
}
