/**
 * Controller layer for Customer entity operations.
 * Handles HTTP requests and responses for customer-related endpoints.
 */

import { Request, Response } from "express";
import * as customerService from "@/modules/customers/customer.service";
import {
  GetAllCustomersDto,
  zUpdateCustomerDto,
} from "@/modules/customers/customer.dto";
import { ZodError, z } from "zod";
import httpStatus from "http-status";
import sendResponse from "@/utils/sendResponse";
import { Customer } from "@/generated/prisma/client";
import asyncHandler from "@/utils/asyncHandler";

const customerIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Customer ID must be a positive integer",
});

/**
 * Get all customers
 */
export const getAllCustomers = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { page, limit, sort, search } =
      req.query as unknown as GetAllCustomersDto["query"];
    const skip = (page - 1) * limit;
    const paginationParams = { page, limit, skip, sort };
    const filterParams = { search };
    const result = await customerService.getAllCustomers(
      paginationParams,
      filterParams
    );

    sendResponse<Customer[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Customers retrieved successfully",
      data: result.customers,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalCount,
        itemsPerPage: limit,
        hasNextPage: page < result.totalPages,
        hasPreviousPage: page > 1,
      },
      meta: {
        totalUnreadMessageCount: result.totalUnreadMessageCount,
      },
    });
  }
);

/**
 * Get a single customer by ID
 */
export const getCustomerById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const customerId = customerIdSchema.parse(req.params.id);
    const customer = await customerService.getCustomerById(customerId);
    if (!customer) {
      sendResponse<null>(res, {
        success: false,
        statusCode: httpStatus.NOT_FOUND,
        message: "Customer not found",
        data: null,
      });
      return;
    }
    sendResponse<Customer>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Customer retrieved successfully",
      data: customer,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(httpStatus.BAD_REQUEST).json({ errors: error.flatten() });
      return;
    }
    sendResponse(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch customer",
      data: null,
    });
  }
};

/**
 * Update a customer by ID
 */
export const updateCustomer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const customerId = customerIdSchema.parse(req.params.id);
    const data = zUpdateCustomerDto.parse(req.body);
    const updated = await customerService.updateCustomer(customerId, data);
    sendResponse<Customer>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Customer updated successfully",
      data: updated,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(httpStatus.BAD_REQUEST).json({ errors: error.flatten() });
      return;
    }
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to update customer",
      data: null,
    });
  }
};

/**
 * Delete a customer by ID
 */
export const deleteCustomer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const customerId = customerIdSchema.parse(req.params.id);
    await customerService.deleteCustomer(customerId);
    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Customer deleted successfully",
      data: null,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(httpStatus.BAD_REQUEST).json({ errors: error.flatten() });
      return;
    }
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to delete customer",
      data: null,
    });
  }
};
