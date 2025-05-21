// import { Response } from "express";
// import { ZodError } from "zod";

// /**
//  * Handle error response
//  */
// export function handleErrorResponse(
//   error: unknown,
//   res: Response,
//   context: string
// ): void {
//   if (error instanceof ZodError) {
//     res.status(400).json({
//       success: false,
//       message: "Validation error",
//       errors: error.flatten(),
//     });
//     return;
//   }

//   const message = error instanceof Error ? error.message : "An error occurred";
//   const statusCode = message.toLowerCase().includes("not found") ? 404 : 500;

//   console.error(`Error in ${context}:`, error);

//   res.status(statusCode).json({
//     success: false,
//     message,
//   });
// }

import { Prisma } from "../../generated/prisma/client";
import { Response } from "express";
import { ZodError } from "zod";

/**
 * Handle error response with enhanced Prisma error handling
 */
export function handleErrorResponse(
  error: unknown,
  res: Response,
  context: string
): void {
  // Log error for debugging
  console.error(`Error in ${context}:`, error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.flatten(),
    });
    return;
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2001": // Record does not exist
      case "P2025": // Record to update/delete not found
        res.status(404).json({
          success: false,
          message: "Resource not found",
          error: error.message,
        });
        break;
      case "P2002": // Unique constraint failed
        res.status(409).json({
          success: false,
          message: "Unique constraint violation",
          error: error.message,
          field: error.meta?.target as string[],
        });
        break;
      case "P2003": // Foreign key constraint failed
        res.status(409).json({
          success: false,
          message: "Foreign key constraint violation",
          error: error.message,
          field: error.meta?.field_name,
        });
        break;
      case "P2004": // Constraint failed
        res.status(409).json({
          success: false,
          message: "Constraint violation",
          error: error.message,
        });
        break;
      case "P2014": // Required relation violation
        res.status(400).json({
          success: false,
          message: "Invalid relation data",
          error: error.message,
        });
        break;
      default:
        res.status(500).json({
          success: false,
          message: "Database operation failed",
          error: error.message,
        });
    }
    return;
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      message: "Invalid data provided",
      error: error.message,
    });
    return;
  }

  // Handle Prisma initialization errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    res.status(500).json({
      success: false,
      message: "Database connection error",
      error: error.message,
    });
    return;
  }

  // Handle Prisma RustPanic errors (rare but possible)
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    res.status(500).json({
      success: false,
      message: "Critical database error",
      error: "Internal server error",
    });
    return;
  }

  // Handle Prisma unknown request errors
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    res.status(500).json({
      success: false,
      message: "Unknown database error",
      error: error.message,
    });
    return;
  }

  // Parse error message for non-instance errors (stringified Prisma errors)
  if (typeof error === "string" || error instanceof Error) {
    const errorMessage = typeof error === "string" ? error : error.message;

    // Check for common Prisma error patterns in string format
    if (
      errorMessage.includes("prisma") &&
      errorMessage.toLowerCase().includes("not found")
    ) {
      res.status(404).json({
        success: false,
        message: "Resource not found",
        error: errorMessage,
      });
      return;
    }

    if (
      errorMessage.includes("prisma") &&
      errorMessage.toLowerCase().includes("unique constraint")
    ) {
      res.status(409).json({
        success: false,
        message: "Duplicate entry",
        error: errorMessage,
      });
      return;
    }

    // Default status code based on error message
    const statusCode = errorMessage.toLowerCase().includes("not found")
      ? 404
      : 500;

    res.status(statusCode).json({
      success: false,
      message: `Failed to ${context}`,
      error: errorMessage || "An error occurred",
    });
    return;
  }

  // Fallback for any other error types
  res.status(500).json({
    success: false,
    message: "An unexpected error occurred",
  });
}
