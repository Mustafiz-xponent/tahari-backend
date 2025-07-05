// src/tests/e2e/admins.e2e.test.ts
import request from "supertest";
import { AdminRole, AdminStatus } from "@/generated/prisma/client";
import { number } from "zod";
import app from "@/app";
import prisma from "@/prisma-client/prismaClient";

describe("Admin API", () => {
  let createdAdminId = number;
  console.log("Prisma client:", prisma); // Log the Prisma client initialization

  it("should create an admin", async () => {
    const testEmail = `john${Math.floor(Math.random() * 100000)}@example.com`;

    const res = await request(app).post("/api/admins").send({
      name: "John Doe",
      email: testEmail,
      password: "secret123",
      address: "CTG",
      role: AdminRole.Admin,
      status: AdminStatus.Active,
    });

    console.log("📨 Sent email:", testEmail);
    console.log("📥 Response status:", res.statusCode);
    console.log("📥 Response body:", res.body);

    // if (res.statusCode !== 201) {
    // throw new Error(
    //   `Failed with status ${res.statusCode}: ${JSON.stringify(res.body)}`
    // );
    // }
    createdAdminId = res.body.adminId; // store ID for later tests
    // expect(res.statusCode).toBe(201);
    // expect(res.body.message).toBe("Admin created successfully");
  });

  //
});
