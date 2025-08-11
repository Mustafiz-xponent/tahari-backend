/**
 * Controller layer for Customer authentication operations.
 * Handles HTTP requests and responses for customer authentication endpoints.
 */
import { Request, Response } from "express";
import { handleErrorResponse } from "@/utils/errorResponseHandler";
import {
  zCustomerIdParam,
  zCustomerLoginDto,
  zCustomerOtpLoginDto,
  zCustomerRegisterDto,
  zCustomerUpdateProfileDto,
  zCustomerVerifyOtpDto,
} from "@/modules/auth/customer/customer.dto";
import * as customerService from "@/modules/auth/customer/customer.service";
import httpStatus from "http-status";
import sendResponse from "@/utils/sendResponse";
import { Customer, User } from "@/generated/prisma/client";

/**
 * Register a customer
 */
export const registerCustomer = async (req: Request, res: Response) => {
  try {
    const data = zCustomerRegisterDto.parse(req.body);
    await customerService.registerCustomer(data);
    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Registration successful. OTP sent to your phone.",
      data: null,
    });
  } catch (error) {
    handleErrorResponse(error, res, "register customer");
  }
};

/**
 * Login customer with email/phone and password
 */
export const loginCustomer = async (req: Request, res: Response) => {
  try {
    const data = zCustomerLoginDto.parse(req.body);
    const { token, user } = await customerService.loginCustomer(data);
    sendResponse<{ token: string; user: Omit<User, "passwordHash"> }>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Login successful",
      data: { token, user },
    });
  } catch (error) {
    handleErrorResponse(error, res, "login customer");
  }
};

/**
 * OTP login customer
 */
export const otpLoginCustomer = async (req: Request, res: Response) => {
  try {
    const data = zCustomerOtpLoginDto.parse(req.body);
    const otp = await customerService.otpLoginCustomer(data);
    sendResponse<{ otp: string }>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "OTP sent successfully",
      data: { otp },
    });
  } catch (error) {
    handleErrorResponse(error, res, "OTP login");
  }
};

/**
 * Verify customer OTP
 */
export const verifyCustomerOtp = async (req: Request, res: Response) => {
  try {
    const data = zCustomerVerifyOtpDto.parse(req.body);
    const { token, user } = await customerService.verifyCustomerOtp(data);

    // Exclude passwordHash from the user object manually
    const { passwordHash, ...sanitizedUser } = user;
    sendResponse<{ token: string; user: Omit<User, "passwordHash"> }>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "OTP verified successfully",
      data: { token, user: sanitizedUser },
    });
  } catch (error) {
    handleErrorResponse(error, res, "verify OTP");
  }
};

/**
 * Update customer profile by ID
 */
export const updateCustomerProfile = async (req: Request, res: Response) => {
  try {
    const requestingUserId = req.user?.userId;
    if (!requestingUserId) {
      throw new Error("Unauthorized");
    }

    const customerId = BigInt(req.params.id);
    if (customerId !== BigInt(requestingUserId)) {
      throw new Error("Invalid request!");
    }

    const data = zCustomerUpdateProfileDto.parse(req.body);
    const updatedUser = await customerService.updateCustomerProfile(
      customerId,
      data
    );

    // Exclude sensitive fields from the response
    const { passwordHash, ...sanitizedUser } = updatedUser;
    sendResponse<{ user: Omit<User, "passwordHash"> }>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Profile updated successfully",
      data: { user: sanitizedUser },
    });
  } catch (error) {
    handleErrorResponse(error, res, "update profile");
  }
};

/**
 * Get customer by ID
 */
export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const customerId = zCustomerIdParam.parse(req.params.id);
    const requestingUserId = req.user?.userId;

    if (!requestingUserId) {
      throw new Error("Authentication required");
    }
    if (BigInt(requestingUserId) !== customerId) {
      throw new Error("Can only access your own profile");
    }
    const customer = await customerService.getCustomerById(customerId);

    sendResponse<Omit<User, "passwordHash">>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Customer retrieved successfully",
      data: customer,
    });
  } catch (error) {
    handleErrorResponse(error, res, "get customer by ID");
  }
};
