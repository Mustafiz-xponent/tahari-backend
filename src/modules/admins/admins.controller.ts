//src/modules/admins/admins.controller.ts
import { Request, Response } from "express";
import * as adminService from "@/modules/admins/admins.service";
import { CreateAdminDto, UpdateAdminDto } from "@/modules/admins/admins.dto";
import { getErrorMessage } from "@/utils/errorHandler";
import httpStatus from "http-status";

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
    res.status(httpStatus.OK).json(admins);
  } catch (error) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: getErrorMessage(error) });
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
      res.status(httpStatus.NOT_FOUND).json({ message: "Admin not found" });
    }
    res.status(httpStatus.OK).json(admin);
  } catch (error) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: getErrorMessage(error) });
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
    res.status(httpStatus.OK).json(updated);
  } catch (error) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: getErrorMessage(error) });
  }
};

export const deleteAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = BigInt(req.params.id);
    const deleted = await adminService.deleteAdmin(id);
    res.status(httpStatus.OK).json(deleted);
  } catch (error) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: getErrorMessage(error) });
  }
};
