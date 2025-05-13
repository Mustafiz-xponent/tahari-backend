/**
 * Controller layer for Customer authentication operations.
 * Handles HTTP requests and responses for customer authentication endpoints.
 */

import { Request, Response } from "express";
import * as customerService from "./customer.service";
import {
  zCustomerRegisterDto,
  zCustomerLoginDto,
  zCustomerOtpLoginDto,
  zCustomerVerifyOtpDto,
} from "./customer.dto";
import { ZodError } from "zod";

/**
 * Register a customer
 */
export const registerCustomer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCustomerRegisterDto.parse(req.body);
    await customerService.registerCustomer(data);
    res.status(201).json({
      message: "Customer registration initiated. OTP sent if phone provided.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error registering customer:", error);
    res.status(500).json({ message: "Failed to register customer" });
  }
};

/**
 * Login a customer with email/password
 */
export const loginCustomer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCustomerLoginDto.parse(req.body);
    const { token, user } = await customerService.loginCustomer(data);
    res.json({ message: "Customer logged in successfully", token, user });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error logging in customer:", error);
    res.status(500).json({ message: "Failed to login customer" });
  }
};

/**
 * Initiate OTP login for customer
 */
export const otpLoginCustomer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCustomerOtpLoginDto.parse(req.body);
    await customerService.otpLoginCustomer(data);
    res.json({ message: "Customer OTP login initiated. OTP sent." });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error initiating customer OTP login:", error);
    res.status(500).json({ message: "Failed to initiate customer OTP login" });
  }
};

/**
 * Verify OTP for customer
 */
export const verifyCustomerOtp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = zCustomerVerifyOtpDto.parse(req.body);
    const { token, user } = await customerService.verifyCustomerOtp(data);
    res.json({ message: "Customer verified successfully", token, user });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error verifying customer OTP:", error);
    res.status(500).json({ message: "Failed to verify customer OTP" });
  }
};
