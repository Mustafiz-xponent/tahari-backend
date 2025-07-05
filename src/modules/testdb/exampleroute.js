import { Router } from "express";
import {
  verifyToken,
  restrictToAdminRole,
  restrictToCustomer,
} from "@/middleware/authMiddleware";
import { AdminRole } from "@prisma/client";

const router = Router();

// Admin-only route (e.g., SuperAdmin only)
router.get(
  "/admin/dashboard",
  verifyToken,
  restrictToAdminRole([AdminRole.SuperAdmin]),
  (req: AuthRequest, res: Response) => {
    res.json({ message: "SuperAdmin dashboard", admin: req.user?.admin });
  }
);

// Customer-only route
router.get(
  "/customer/profile",
  verifyToken,
  restrictToCustomer,
  (req: AuthRequest, res: Response) => {
    res.json({ message: "Customer profile", customer: req.user?.customer });
  }
);

export default router;
