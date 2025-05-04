// src/modules/farmers/farmers.routes.ts

import { Router } from "express";
import * as FarmerController from "./farmers.controller";



const router = Router();

// Route to create a new farmer
router.post("/", FarmerController.createFarmer);

// Route to get all farmers
router.get("/", FarmerController.getAllFarmers);

// Route to get a farmer by ID
router.get("/:id", FarmerController.getFarmerById);

// Route to update a farmer's details
router.put("/:id", FarmerController.updateFarmer);

// Route to delete a farmer
router.delete("/:id", FarmerController.deleteFarmer);

export default router;
