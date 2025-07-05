import { RequestHandler, Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import httpStatus from "http-status";

type Schemas = {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
};

const validator = (schemas: Schemas): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const errors: Array<{ location: string; field: string; message: string }> =
      [];

    if (schemas.body) {
      const bodyResult = await schemas.body.safeParseAsync(req.body);
      if (!bodyResult.success) {
        bodyResult.error.errors.forEach((err) => {
          errors.push({
            location: "body",
            field: err.path.join("."),
            message: err.message,
          });
        });
      } else {
        req.body = bodyResult.data;
      }
    }

    if (schemas.query) {
      const queryResult = await schemas.query.safeParseAsync(req.query);
      if (!queryResult.success) {
        queryResult.error.errors.forEach((err) => {
          errors.push({
            location: "query",
            field: err.path.join("."),
            message: err.message,
          });
        });
      } else {
        req.query = queryResult.data;
      }
    }

    if (schemas.params) {
      const paramsResult = await schemas.params.safeParseAsync(req.params);
      if (!paramsResult.success) {
        paramsResult.error.errors.forEach((err) => {
          errors.push({
            location: "params",
            field: err.path.join("."),
            message: err.message,
          });
        });
      } else {
        req.params = paramsResult.data;
      }
    }

    if (errors.length > 0) {
      const combinedMessage = errors
        .map((err) => `[${err.location}.${err.field}: ${err.message}]`)
        .join(", ");

      res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        error: {
          message: `VALIDATION FAILED: ${combinedMessage}`,
        },
      });
      return;
    }

    next();
  };
};

export default validator;
