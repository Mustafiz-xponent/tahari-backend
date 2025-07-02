/**
 * Controller layer for Customer entity operations.
 * Handles HTTP requests and responses for customer-related endpoints.
 */

import { Request, Response } from "express";
import * as customerService from "./customer.service";
import { zCreateCustomerDto, zUpdateCustomerDto } from "./customer.dto";
import { ZodError, z } from "zod";

const customerIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Customer ID must be a positive integer",
});

/**
 * Create a new customer
 */
// export const createCustomer = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const data = zCreateCustomerDto.parse(req.body);
//     const customer = await customerService.createCustomer(data);
//     res
//       .status(201)
//       .json({ message: "Customer created successfully", customer });
//   } catch (error) {
//     if (error instanceof ZodError) {
//       res.status(400).json({ errors: error.flatten() });
//       return;
//     }
//     console.error("Error creating customer:", error);
//     res.status(500).json({ message: "Failed to create customer" });
//   }
// };

/**
 * Get all customers
 */
export const getAllCustomers = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const customers = await customerService.getAllCustomers();
    res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Failed to fetch customers" });
  }
};

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
      res.status(404).json({ message: "Customer not found" });
      return;
    }
    res.json(customer);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error fetching customer:", error);
    res.status(500).json({ message: "Failed to fetch customer" });
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
    res.json({ message: "Customer updated successfully", customer: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error updating customer:", error);
    res.status(500).json({ message: "Failed to update customer" });
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
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.flatten() });
      return;
    }
    console.error("Error deleting customer:", error);
    res.status(500).json({ message: "Failed to delete customer" });
  }
};
