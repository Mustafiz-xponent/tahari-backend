// src/modules/farmers/farmers.routes.ts

import { Router } from "express";
import * as FarmerController from "./farmers.controller";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

// Route to create a new farmer by admin
router.post("/", authMiddleware("ADMIN"), FarmerController.createFarmer);

// Route to get all farmers
router.get("/", FarmerController.getAllFarmers);

// Route to get a farmer by ID
router.get("/:id", FarmerController.getFarmerById);

// Route to update a farmer's details by admin
router.put("/:id", authMiddleware("ADMIN"), FarmerController.updateFarmer);

// Route to delete a farmer by admin
router.delete("/:id", authMiddleware("ADMIN"), FarmerController.deleteFarmer);

export default router;
