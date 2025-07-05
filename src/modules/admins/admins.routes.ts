import { Router } from "express";
import * as AdminController from "@/modules/admins/admins.controller";

const router = Router();

// router.post("/", AdminController.createAdmin);
router.get("/", AdminController.getAllAdmins);
router.get("/:id", AdminController.getAdminById);
router.put("/:id", AdminController.updateAdmin);
router.delete("/:id", AdminController.deleteAdmin);

export default router;
