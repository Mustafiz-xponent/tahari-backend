//src/modules/admins/admins.controller.ts
import { Request, Response } from "express";
import * as adminService from "@/modules/admins/admins.service";
import { CreateAdminDto, UpdateAdminDto } from "@/modules/admins/admins.dto";
import { getErrorMessage } from "@/utils/errorHandler";
import httpStatus from "http-status";
import sendResponse from "@/utils/sendResponse";
import { Admin } from "@/generated/prisma/client";

export const getAllAdmins = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const admins = await adminService.getAllAdmins();
    sendResponse<Admin[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admins retrieved successfully",
      data: admins,
    });
  } catch (error) {
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch admins",
      data: null,
    });
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
      sendResponse<null>(res, {
        success: false,
        statusCode: httpStatus.NOT_FOUND,
        message: "Admin not found",
        data: null,
      });
      return;
    }
    sendResponse<Admin>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admin retrieved successfully",
      data: admin,
    });
  } catch (error) {
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch admin",
      data: null,
    });
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
    sendResponse<Admin>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admin updated successfully",
      data: updated,
    });
  } catch (error) {
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to update admin",
      data: null,
    });
  }
};

export const deleteAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = BigInt(req.params.id);
    const deleted = await adminService.deleteAdmin(id);
    sendResponse<Admin>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admin deleted successfully",
      data: deleted,
    });
  } catch (error) {
    sendResponse<null>(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to delete admin",
      data: null,
    });
  }
};
