import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { status } from "http-status";

type Schemas = {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
};

/**
 * Validator middleware for Express.js using Zod schemas
 * @param {Schemas} schemas - Object containing validation schemas
 * @returns {Function} Express middleware function
 */
const validator = (schemas: Schemas) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, unknown> = {};

    try {
      // Validate request body if schema provided
      if (schemas.body) {
        const bodyResult = schemas.body.safeParse(req.body);
        if (!bodyResult.success) {
          errors.body = bodyResult.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          }));
        } else {
          req.body = bodyResult.data; // Use parsed/transformed data
        }
      }

      // Validate query parameters if schema provided
      if (schemas.query) {
        const queryResult = schemas.query.safeParse(req.query);
        if (!queryResult.success) {
          errors.query = queryResult.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          }));
        } else {
          req.query = queryResult.data; // Use parsed/transformed data
        }
      }

      // Validate route parameters if schema provided
      if (schemas.params) {
        const paramsResult = schemas.params.safeParse(req.params);
        if (!paramsResult.success) {
          errors.params = paramsResult.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          }));
        } else {
          req.params = paramsResult.data; // Use parsed/transformed data
        }
      }

      // If there are validation errors, return them
      if (Object.keys(errors).length > 0) {
        return res.status(status.BAD_REQUEST).json({
          success: false,
          message: "VALIDATION FAILED",
          errors: errors,
        });
      }

      // If all validations pass, continue to next middleware
      next();
    } catch (error) {
      return res.status(status.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error during validation",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
};

export default validator;
