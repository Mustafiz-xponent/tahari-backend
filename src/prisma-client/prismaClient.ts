import { PrismaClient } from "@/generated/prisma/client";

const isTest = process.env.NODE_ENV === "test";

// const prisma = new PrismaClient({
//   datasources: {
//     db: {
//       url: isTest
//         ? "file:./test.db?mode=memory&cache=shared"
//         : process.env.DATABASE_URL,
//     },
//   },
// });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: isTest
        ? "file:./test.db?mode=memory&cache=shared"
        : process.env.DATABASE_URL,
    },
  },
  // @ts-ignore
  __internal: {
    engine: {
      disablePrepareStatements: true,
    },
  },
});

export default prisma;
// import { PrismaClient } from "@/generated/prisma/client";

// const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// const isTest = process.env.NODE_ENV === "test";

// export const prisma =
//   globalForPrisma.prisma ??
//   new PrismaClient({
//     datasources: {
//       db: {
//         url: isTest
//           ? "file:./test.db?mode=memory&cache=shared"
//           : process.env.DATABASE_URL,
//       },
//     },
//   });

// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// export default prisma;
