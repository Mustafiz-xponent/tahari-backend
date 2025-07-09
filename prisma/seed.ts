// prisma/seed.ts

// import {
//   AdminRole,
//   AdminStatus,
//   PrismaClient,
// } from "../generated/prisma/client";
// import * as admin from "firebase-admin";
// import serviceAccount from "../src/config/serviceAccountKey.json";

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
// });

// const prisma = new PrismaClient();

// async function seed() {
//   // Create SuperAdmin in Firebase
//   const superAdminEmail =
//     process.env.SUPERADMIN_EMAIL || "superadmin@example.com";
//   const superAdminPassword =
//     process.env.SUPERADMIN_PASSWORD || "securePassword123";
//   let superAdminFirebaseUid;

//   try {
//     const userRecord = await admin.auth().createUser({
//       email: superAdminEmail,
//       password: superAdminPassword,
//       displayName: "Super Admin",
//     });
//     superAdminFirebaseUid = userRecord.uid;
//   } catch (error: any) {
//     if (error.code === "auth/email-already-exists") {
//       console.log("SuperAdmin already exists in Firebase, fetching UID...");
//       const user = await admin.auth().getUserByEmail(superAdminEmail);
//       superAdminFirebaseUid = user.uid;
//     } else {
//       throw error;
//     }
//   }

//   // Create SuperAdmin in database
//   await prisma.admin.upsert({
//     where: { email: superAdminEmail },
//     update: {},
//     create: {
//       firebaseUid: superAdminFirebaseUid,
//       name: "Super Admin",
//       email: superAdminEmail,
//       phone: "123-456-7890",
//       address: "Admin Office",
//       role: AdminRole.SuperAdmin,
//       status: AdminStatus.Active,
//     },
//   });

//   // Seed a regular Admin
//   const adminEmail = "admin@example.com";
//   let adminFirebaseUid;

//   try {
//     const userRecord = await admin.auth().createUser({
//       email: adminEmail,
//       password: "adminPassword123",
//       displayName: "Admin User",
//     });
//     adminFirebaseUid = userRecord.uid;
//   } catch (error: any) {
//     if (error.code === "auth/email-already-exists") {
//       console.log("Admin already exists in Firebase, fetching UID...");
//       const user = await admin.auth().getUserByEmail(adminEmail);
//       adminFirebaseUid = user.uid;
//     } else {
//       throw error;
//     }
//   }

//   await prisma.admin.upsert({
//     where: { email: adminEmail },
//     update: {},
//     create: {
//       firebaseUid: adminFirebaseUid,
//       name: "Admin User",
//       email: adminEmail,
//       phone: "987-654-3210",
//       address: "Admin Office",
//       role: AdminRole.Admin,
//       status: AdminStatus.Active,
//     },
//   });

//   // Seed a Customer with a Wallet
//   const customerEmail = "customer@example.com";
//   let customerFirebaseUid;

//   try {
//     const userRecord = await admin.auth().createUser({
//       email: customerEmail,
//       password: "customerPassword123",
//       displayName: "Customer User",
//     });
//     customerFirebaseUid = userRecord.uid;
//   } catch (error: any) {
//     if (error.code === "auth/email-already-exists") {
//       console.log("Customer already exists in Firebase, fetching UID...");
//       const user = await admin.auth().getUserByEmail(customerEmail);
//       customerFirebaseUid = user.uid;
//     } else {
//       throw error;
//     }
//   }

//   const customer = await prisma.customer.upsert({
//     where: { email: customerEmail },
//     update: {},
//     create: {
//       firebaseUid: customerFirebaseUid,
//       name: "Customer User",
//       email: customerEmail,
//       phone: "555-555-5555",
//       address: "Customer Address",
//     },
//   });

//   await prisma.wallet.upsert({
//     where: { customerId: customer.customerId },
//     update: {},
//     create: {
//       customerId: customer.customerId,
//       balance: 0.0,
//     },
//   });

//   console.log("Database seeded successfully");
// }

// seed()
//   .catch((e) => {
//     console.error("Seeding failed:", e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

//  ================= 2nd edition =====================

import {
  PrismaClient,
  UserRole,
  UserStatus,
} from "../src/generated/prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function seed() {
  // Create SuperAdmin
  const superAdminEmail =
    process.env.SUPERADMIN_EMAIL || "superadmin@example.com";
  const superAdminPhone = process.env.SUPERADMIN_PHONE || "+8801700000000";
  const superAdminPassword =
    process.env.SUPERADMIN_PASSWORD || "securePassword123";

  // Hash the password
  const passwordHash = await bcrypt.hash(superAdminPassword, SALT_ROUNDS);

  // Create User for SuperAdmin
  const superAdminUser = await prisma.user.upsert({
    where: { phone: superAdminPhone },
    update: {
      email: superAdminEmail,
      name: "Super Admin",
      phone: superAdminPhone,
      address: ["Admin Office"],
      passwordHash: passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: superAdminEmail,
      name: "Super Admin",
      phone: superAdminPhone,
      address: ["Admin Office"],
      passwordHash: passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // Create Admin record linked to the User
  await prisma.admin.upsert({
    where: { userId: superAdminUser.userId },
    update: { userId: superAdminUser.userId },
    create: {
      userId: superAdminUser.userId,
    },
  });

  // Seed a regular Admin
  const adminEmail = "admin@example.com";
  const adminPhone = "+8801800000000";
  const adminPassword = "adminPassword123";
  const adminPasswordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);

  const adminUser = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {
      email: adminEmail,
      name: "Admin User",
      phone: adminPhone,
      address: ["Admin Office"],
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: adminEmail,
      name: "Admin User",
      phone: adminPhone,
      address: ["Admin Office"],
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.admin.upsert({
    where: { userId: adminUser.userId },
    update: { userId: adminUser.userId },
    create: {
      userId: adminUser.userId,
    },
  });

  // Seed a Customer with a Wallet
  const customerEmail = "customer@example.com";
  const customerPhone = "+8801600000000";
  const customerPassword = "customerPassword123";
  const customerPasswordHash = await bcrypt.hash(customerPassword, SALT_ROUNDS);

  const customerUser = await prisma.user.upsert({
    where: { phone: customerPhone },
    update: {
      email: customerEmail,
      name: "Customer User",
      phone: customerPhone,
      address: ["Customer Address"],
      passwordHash: customerPasswordHash,
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: customerEmail,
      name: "Customer User",
      phone: customerPhone,
      address: ["Customer Address"],
      passwordHash: customerPasswordHash,
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
    },
  });

  const customer = await prisma.customer.upsert({
    where: { userId: customerUser.userId },
    update: { userId: customerUser.userId },
    create: {
      userId: customerUser.userId,
    },
  });

  await prisma.wallet.upsert({
    where: { customerId: customer.customerId },
    update: {},
    create: {
      customerId: customer.customerId,
      balance: 0.0,
    },
  });

  console.log("Database seeded successfully");
}

seed()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
