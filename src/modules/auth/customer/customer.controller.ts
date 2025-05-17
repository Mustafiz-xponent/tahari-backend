/**
 * Controller layer for Customer authentication operations.
 * Handles HTTP requests and responses for customer authentication endpoints.
 */
import { Request, Response } from "express";
import { handleErrorResponse } from "../../../utils/errorResponseHandler";
import {
  zCustomerLoginDto,
  zCustomerOtpLoginDto,
  zCustomerRegisterDto,
  zCustomerUpdateProfileDto,
  zCustomerVerifyOtpDto,
} from "./customer.dto";
import * as customerService from "./customer.service";

/**
 * Register a customer
 */
export const registerCustomer = async (req: Request, res: Response) => {
  try {
    const data = zCustomerRegisterDto.parse(req.body);
    await customerService.registerCustomer(data);
    res.status(201).json({
      success: true,
      message: "Registration successful. OTP sent to your phone.",
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
    res.json({
      success: true,
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
    await customerService.otpLoginCustomer(data);
    res.json({
      success: true,
      message: "OTP sent successfully",
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

    res.json({
      success: true,
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

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: sanitizedUser,
    });
  } catch (error) {
    handleErrorResponse(error, res, "update profile");
  }
};
