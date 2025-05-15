import { Response } from "express";
import { ZodError } from "zod";

/**
 * Handle error response
 */
export function handleErrorResponse(
  error: unknown,
  res: Response,
  context: string
): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.flatten(),
    });
    return;
  }

  const message = error instanceof Error ? error.message : "An error occurred";
  const statusCode = message.toLowerCase().includes("not found") ? 404 : 500;

  console.error(`Error in ${context}:`, error);

  res.status(statusCode).json({
    success: false,
    message,
  });
}
