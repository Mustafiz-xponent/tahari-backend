// src/types/express/index.d.ts
import { JwtPayload } from "jsonwebtoken";
import { User } from "@/generated/prisma/client";
declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload | User;
  }
}
declare module "socket.io" {
  interface Socket {
    user?: IUser | string;
  }
}
