import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
export const rateLimiter = (maxRequests: number, time: number) => {
  return rateLimit({
    max: maxRequests,
    windowMs: time,
    message: "Too many requests, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response, _next: NextFunction) => {
      res.status(httpStatus.TOO_MANY_REQUESTS).json({
        success: false,
        message: "Too many requests, please try again later",
      });
    },
  });
};
