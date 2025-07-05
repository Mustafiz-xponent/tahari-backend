import { PrismaClient } from "@/generated/prisma/client";

const isTest = process.env.NODE_ENV === "test";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: isTest
        ? "file:./test.db?mode=memory&cache=shared"
        : process.env.DATABASE_URL,
    },
  },
});

export default prisma;
