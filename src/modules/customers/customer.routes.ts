/**
 * Routes for Customer entity operations.
 * Defines API endpoints for customer-related CRUD operations.
 */

import { Router } from "express";
import * as CustomerController from "@/modules/customers/customer.controller";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import { UserRole } from "@/generated/prisma/client";
import validator from "@/middlewares/validator";
import { zGetAllCustomersDto } from "./customer.dto";

const router = Router();

// Route to create a new customer
// router.post("/", CustomerController.createCustomer);

// Route to get all customers
router.get(
  "/",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validator(zGetAllCustomersDto),
  CustomerController.getAllCustomers
);

// Route to get a customer by ID
router.get("/:id", CustomerController.getCustomerById);

// Route to update a customer's details
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CustomerController.updateCustomer
);

// Route to delete a customer
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CustomerController.deleteCustomer
);

export default router;
