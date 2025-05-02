// src/modules/admins/admins.dto.ts


export enum AdminRole {
  SuperAdmin = "SuperAdmin",
  Admin = "Admin",
  Support = "Support",
}

export enum AdminStatus {
  Active = "Active",
  Fired = "Fired",
  InActive = "InActive",
}

export interface CreateAdminDto {
  name: string;
  email: string;
  phone?: string;
  address: string;
  role: AdminRole;
  status: AdminStatus;
  password: string;
 
}

export interface UpdateAdminDto {
  name?: string;
  phone?: string;
  address?: string;
  role?: AdminRole;
  status?: AdminStatus;
  password?: string;
}
