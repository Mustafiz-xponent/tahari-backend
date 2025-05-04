// vitest-environment-prisma/prisma-test-environment.ts
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { execSync } from "node:child_process";
import type { Environment } from "vitest/environments";
import "dotenv/config";

const prisma = new PrismaClient();

function generateDatabaseURL(schema: string) {
  if (!process.env.DATABASE_URL) {
    throw new Error("Please provide a DATABASE_URL environment variable.");
  }

  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set("schema", schema);
  return url.toString();
}

const environment: Environment = {
  name: "prisma",
  transformMode: "ssr", // required by Environment type
  async setup() {
    const schema = randomUUID();
    const databaseURL = generateDatabaseURL(schema);
    process.env.DATABASE_URL = databaseURL;

    // Apply Prisma migrations
    execSync("npx prisma migrate deploy", { stdio: "inherit" });

    return {
      teardown: async () => {
        await prisma.$executeRawUnsafe(
          `DROP SCHEMA IF EXISTS "${schema}" CASCADE`
        );
        await prisma.$disconnect();
      },
    };
  },
};

export default environment;
