// src/routes/authRoutes.ts
import { Router } from "express";
import { auth } from "../config/firebase";
import { PrismaClient } from "../generated/prisma/client"; // Adjust path
import { AdminRole, AdminStatus } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.post("/admin/signup", async (req, res) => {
  const { name, email, password, phone, address, role } = req.body;

  // Restrict SuperAdmin creation
  if (role === AdminRole.SuperAdmin) {
    return res
      .status(403)
      .json({ error: "Cannot create SuperAdmin via this endpoint" });
  }

  try {
    // Create user in Firebase
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // Store admin in database
    const admin = await prisma.admin.create({
      data: {
        firebaseUid: userRecord.uid,
        name,
        email,
        phone,
        address,
        role: role || AdminRole.Admin, // Default to Admin
        status: AdminStatus.Active,
      },
    });

    res.status(201).json({ message: "Admin created", admin });
  } catch (error: any) {
    console.error("Error creating admin:", error);
    res.status(500).json({ error: error.message || "Failed to create admin" });
  }
});

router.post("/customer/signup", async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  try {
    // Create user in Firebase
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // Store customer in database
    const customer = await prisma.customer.create({
      data: {
        firebaseUid: userRecord.uid,
        name,
        email,
        phone,
        address,
      },
    });

    // Create wallet for customer
    await prisma.wallet.create({
      data: {
        customerId: customer.customerId,
        balance: 0.0,
      },
    });

    res.status(201).json({ message: "Customer created", customer });
  } catch (error: any) {
    console.error("Error creating customer:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to create customer" });
  }
});

router.get("/me", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.admin) {
      return res.json({ userType: "admin", data: req.user.admin });
    }
    if (req.user?.customer) {
      return res.json({ userType: "customer", data: req.user.customer });
    }
    return res.status(404).json({ error: "User not found" });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
