import { RequestHandler, Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import httpStatus from "http-status";

type Schemas = {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
};

/**
 * Express middleware to validate request body, query, and params against
 * provided Zod schemas. If validation passes, the request object is updated
 * with the parsed data. If validation fails, a 400 Bad Request response is
 * sent with detailed error messages.
 *
 * @param {Schemas} schemas - An object containing Zod schemas for 'body',
 * 'query', and 'params'. Each schema is optional.
 * @returns {RequestHandler} - An Express request handler middleware.
 */

const validator = (schemas: Schemas): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const errors: Array<{ location: string; field: string; message: string }> =
      [];

    if (schemas.body) {
      const isMultipart = req.headers["content-type"]?.includes(
        "multipart/form-data"
      );
      const bodyData = isMultipart ? coerceFormValues(req.body) : req.body;
      const bodyResult = await schemas.body.safeParseAsync(bodyData);
      console.log(req.body, isMultipart);
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

/**
 * Coerces form data values to their proper types.
 * @param obj an object with string values
 * @returns an object with the same keys as `obj` but with the values coerced to their proper types
 * @description converts "true" to true, "false" to false, and "123" to 123
 **/
function coerceFormValues(obj: Record<string, any>) {
  const result: Record<string, any> = {};

  for (const key in obj) {
    const val = obj[key];

    if (val === "true") result[key] = true;
    else if (val === "false") result[key] = false;
    else if (!isNaN(Number(val)) && val.trim() !== "")
      result[key] = Number(val);
    else result[key] = val;
  }

  return result;
}
