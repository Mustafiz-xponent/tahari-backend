import { createAdmin } from "@/modules/admins/admins.service";
import prisma from "@/prisma-client/prismaClient";

import {
  CreateAdminDto,
  AdminRole,
  AdminStatus,
} from "@/modules/admins/admins.dto";

jest.mock("@/prisma-client/prismaClient", () => ({
  admin: {
    create: jest.fn(),
  },
}));

describe("Admin Service - createAdmin", () => {
  it("should create a new admin", async () => {
    const dto: CreateAdminDto = {
      name: "Test Admin",
      email: "test@example.com",
      address: "123 Admin Street",
      role: AdminRole.Admin,
      status: AdminStatus.Active,
      password: "secret123",
    };

    const mockAdmin = {
      ...dto,
      adminId: 1n,
      passwordHash: "hashed_password",
    };

    (prisma.admin.create as jest.Mock).mockResolvedValue(mockAdmin);

    const result = await createAdmin(dto);

    expect(prisma.admin.create).toHaveBeenCalled();
    expect(result.name).toBe("Test Admin");
  });
});
