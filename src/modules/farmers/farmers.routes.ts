// src/modules/farmers/farmers.routes.ts

import { Router } from "express";
import * as FarmerController from "@/modules/farmers/farmers.controller";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import { UserRole } from "@/generated/prisma/client";

const router = Router();

// Route to create a new farmer by admin
router.post(
  "/",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  FarmerController.createFarmer
);

// Route to get all farmers
router.get("/", FarmerController.getAllFarmers);

// Route to get a farmer by ID
router.get("/:id", FarmerController.getFarmerById);

// Route to update a farmer's details by admin
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  FarmerController.updateFarmer
);

// Route to delete a farmer by admin
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  FarmerController.deleteFarmer
);

export default router;
