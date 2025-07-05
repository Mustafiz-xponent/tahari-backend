// src/types/express/index.d.ts
import { JwtPayload } from "jsonwebtoken";
import { User } from "@/generated/prisma/client";
declare module "express-serve-static-core" {
  // namespace Express {
  interface Request {
    user?: JwtPayload | User;
  }
  // }
}
