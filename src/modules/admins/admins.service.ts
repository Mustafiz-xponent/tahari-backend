//src/modules/admins/admins.service.ts


import prisma from "../../prisma-client/prismaClient";
import { CreateAdminDto, UpdateAdminDto } from "./admins.dto";
import { Admin } from "../../../generated/prisma/client";
import { getErrorMessage } from "../../utils/errorHandler";
import bcrypt from "bcrypt";



export const createAdmin = async (data: CreateAdminDto): Promise<Admin> =>  {
  const saltRounds = 10;
   
  
  try {
    if (!data.password || data.password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    const passwordHash = await bcrypt.hash(data.password, saltRounds);

   const admin = await prisma.admin.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        role: data.role,
        status: data.status,
        passwordHash,
      },
    });
    console.log("admin created successfull")
    return admin;
   
  } catch (err: any) {
    console.log(err)
 
    console.error("Error creating admin:", err);
    throw new Error("Failed to create admin");
  }
};

export const getAllAdmins = async () : Promise<Admin[]> => {
  return prisma.admin.findMany();
};

export const getAdminById = async (adminId: bigint): Promise<Admin|null> => {
  try {
    return await prisma.admin.findUnique({
      where: { adminId: Number(adminId) }, // Convert BigInt to Number for Prisma compatibility
    });
  } catch (error) {
    throw new Error(`Error fetching farmer by ID: ${getErrorMessage(error)}`);
  }
};

export const updateAdmin = async (adminId: bigint, data: UpdateAdminDto): Promise<Admin> => {
  const updateData: any = { ...data };

  if (data.password) {
    const saltRounds = 10;
    updateData.passwordHash = await bcrypt.hash(data.password, saltRounds);
    delete updateData.password;
  }

  return prisma.admin.update({
    where: { adminId },
    data: updateData,
  });
};

 

export const deleteAdmin = async (farmerId: BigInt): Promise<Admin> => {
  try {
    return await prisma.admin.delete({
      where: { adminId: Number(farmerId) }, // Convert BigInt to Number for Prisma compatibility
    });
  } catch (error) {
    throw new Error(`Error deleting farmer: ${getErrorMessage(error)}`);
  }
};
