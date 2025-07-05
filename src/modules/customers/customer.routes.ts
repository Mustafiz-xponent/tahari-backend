/**
 * Routes for Customer entity operations.
 * Defines API endpoints for customer-related CRUD operations.
 */

import { Router } from "express";
import * as CustomerController from "@/modules/customers/customer.controller";

const router = Router();

// Route to create a new customer
// router.post("/", CustomerController.createCustomer);

// Route to get all customers
router.get("/", CustomerController.getAllCustomers);

// Route to get a customer by ID
router.get("/:id", CustomerController.getCustomerById);

// Route to update a customer's details
router.put("/:id", CustomerController.updateCustomer);

// Route to delete a customer
router.delete("/:id", CustomerController.deleteCustomer);

export default router;
