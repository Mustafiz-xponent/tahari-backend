import { handleErrorResponse } from "@/utils/errorResponseHandler";
import sendResponse from "@/utils/sendResponse";

import httpStatus from "http-status";
import * as dasboardService from "@/modules/dashboard/dashboard.services";
import { Response, Request } from "express";
import { DashboardSummary } from "./dashboard.interfaces";

// Controller function
export const getDashboardSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Parse year from query parameter, default to current year
    let year: number | undefined;

    if (req.query.year) {
      const yearParam = parseInt(req.query.year as string);

      //   // Validate year (reasonable range: 2000-2050)
      //   if (isNaN(yearParam) || yearParam < 2000 || yearParam > 2050) {
      //     return sendResponse(res, {
      //       success: false,
      //       statusCode: httpStatus.BAD_REQUEST,
      //       message: "Invalid year parameter. Please provide a year between 2000 and 2050.",
      //     });
      //   }

      year = yearParam;
    }

    const summary = await dasboardService.getDashboardSummary(year);

    sendResponse<DashboardSummary>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Dashboard summary retrieved successfully",
      data: summary,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch dashboard summary");
  }
};
