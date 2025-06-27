import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";
export const rateLimiter = (maxRequests: number, time: number) => {
  return rateLimit({
    max: maxRequests,
    windowMs: time,
    message: "Too many requests, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response, _next: NextFunction) => {
      res.status(429).json({
        success: false,
        message: "Too many requests, please try again later",
      });
    },
  });
};
