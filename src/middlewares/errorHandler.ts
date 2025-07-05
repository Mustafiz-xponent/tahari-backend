import httpStatus from "http-status";
import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";

import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { AppError } from "@/utils/appError";
import logger from "@/utils/logger";

const handlePrismaError = (error: unknown): AppError => {
  let message = "Database operation failed";
  let statusCode = httpStatus.INTERNAL_SERVER_ERROR as number;

  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        message = `Unique constraint violation: ${
          (error.meta?.target as string[])?.join(", ") || "field"
        }`;
        statusCode = httpStatus.CONFLICT;
        break;
      case "P2025":
        message = "Record not found";
        statusCode = httpStatus.NOT_FOUND;
        break;
      case "P2003":
        message = "Foreign key constraint violation";
        statusCode = httpStatus.BAD_REQUEST;
        break;
      case "P2014":
        message = "Invalid ID provided";
        statusCode = httpStatus.BAD_REQUEST;
        break;
      case "P2021":
        message = "Table does not exist";
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        break;
      case "P2022":
        message = "Column does not exist";
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        break;
      default:
        message = `Database error: ${error.message}`;
    }
  } else if (error instanceof PrismaClientUnknownRequestError) {
    message = "Unknown database error occurred";
  } else if (error instanceof PrismaClientRustPanicError) {
    message = "Database connection error";
  } else if (error instanceof PrismaClientInitializationError) {
    message = "Database initialization error";
  } else if (error instanceof PrismaClientValidationError) {
    message = "Invalid data provided";
    statusCode = httpStatus.BAD_REQUEST;
  }

  return new AppError(message, statusCode);
};

const handleJWTError = () =>
  new AppError("Invalid token", httpStatus.UNAUTHORIZED);

const handleJWTExpiredError = () =>
  new AppError("Token expired", httpStatus.UNAUTHORIZED);

const handleValidationError = (error: any) => {
  const errors = Object.values(error.errors).map((err: any) => err.message);
  const message = `Invalid input data: ${errors.join(", ")}`;
  return new AppError(message, httpStatus.BAD_REQUEST);
};

const sendErrorDev = (err: AppError, res: Response) => {
  res.status(err.statusCode).json({
    success: false,
    error: {
      message: err.message,
      stack: err.stack,
      details: err,
    },
  });
};

const sendErrorProd = (err: AppError, res: Response) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
      },
    });
  } else {
    logger.error("UNEXPECTED ERROR 💥", err);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        message: "Something went wrong!",
      },
    });
  }
};

export const globalErrorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err as AppError;
  error.statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(error, res);
  } else {
    if (
      err instanceof PrismaClientKnownRequestError ||
      err instanceof PrismaClientUnknownRequestError ||
      err instanceof PrismaClientRustPanicError ||
      err instanceof PrismaClientInitializationError ||
      err instanceof PrismaClientValidationError
    ) {
      error = handlePrismaError(err);
    } else if (err.name === "JsonWebTokenError") {
      error = handleJWTError();
    } else if (err.name === "TokenExpiredError") {
      error = handleJWTExpiredError();
    } else if (err.name === "ValidationError") {
      error = handleValidationError(err);
    }

    sendErrorProd(error, res);
  }
};
