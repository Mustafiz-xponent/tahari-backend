//src/modules/admins/admins.controller.ts
import { Request, Response } from "express";
import * as adminService from "./admins.service";
import { CreateAdminDto, UpdateAdminDto } from "./admins.dto";
import { getErrorMessage } from "../../utils/errorHandler";

// export const createAdmin = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const data: CreateAdminDto = req.body;
//     console.log("✅ Received admin data:", data);

//     const admin = await adminService.createAdmin(data);
//     // Convert BigInt fields (like adminId) to string
//     const adminSafe = {
//       ...admin,
//       adminId: admin.adminId.toString(), // convert BigInt to string
//     };

//     res.status(201).json({
//       message: "Admin created successfully",
//       data: adminSafe,
//     });
//   } catch (error) {
//     console.error("Create admin error:", error);
//     res.status(500).json({ error: getErrorMessage(error) });
//   }
// };

export const getAllAdmins = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const admins = await adminService.getAllAdmins();
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

export const getAdminById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = BigInt(req.params.id);
    const admin = await adminService.getAdminById(id);
    if (!admin) {
      res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

export const updateAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = BigInt(req.params.id);
    const data: UpdateAdminDto = req.body;
    const updated = await adminService.updateAdmin(id, data);
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

export const deleteAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = BigInt(req.params.id);
    const deleted = await adminService.deleteAdmin(id);
    res.status(200).json(deleted);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};
