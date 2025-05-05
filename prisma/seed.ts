// prisma/seed.ts
import { PrismaClient } from "../generated/prisma/client"; // Adjust path
import { AdminRole, AdminStatus } from "@prisma/client";
import * as admin from "firebase-admin";
import serviceAccount from "../config/serviceAccountKey.json"; // Adjust path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const prisma = new PrismaClient();

async function seed() {
  // Create SuperAdmin in Firebase
  const superAdminEmail =
    process.env.SUPERADMIN_EMAIL || "superadmin@example.com";
  const superAdminPassword =
    process.env.SUPERADMIN_PASSWORD || "securePassword123";
  let superAdminFirebaseUid;

  try {
    const userRecord = await admin.auth().createUser({
      email: superAdminEmail,
      password: superAdminPassword,
      displayName: "Super Admin",
    });
    superAdminFirebaseUid = userRecord.uid;
  } catch (error: any) {
    if (error.code === "auth/email-already-exists") {
      console.log("SuperAdmin already exists in Firebase, fetching UID...");
      const user = await admin.auth().getUserByEmail(superAdminEmail);
      superAdminFirebaseUid = user.uid;
    } else {
      throw error;
    }
  }

  // Create SuperAdmin in database
  await prisma.admin.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      firebaseUid: superAdminFirebaseUid,
      name: "Super Admin",
      email: superAdminEmail,
      phone: "123-456-7890",
      address: "Admin Office",
      role: AdminRole.SuperAdmin,
      status: AdminStatus.Active,
    },
  });

  // Seed a regular Admin
  const adminEmail = "admin@example.com";
  let adminFirebaseUid;

  try {
    const userRecord = await admin.auth().createUser({
      email: adminEmail,
      password: "adminPassword123",
      displayName: "Admin User",
    });
    adminFirebaseUid = userRecord.uid;
  } catch (error: any) {
    if (error.code === "auth/email-already-exists") {
      console.log("Admin already exists in Firebase, fetching UID...");
      const user = await admin.auth().getUserByEmail(adminEmail);
      adminFirebaseUid = user.uid;
    } else {
      throw error;
    }
  }

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      firebaseUid: adminFirebaseUid,
      name: "Admin User",
      email: adminEmail,
      phone: "987-654-3210",
      address: "Admin Office",
      role: AdminRole.Admin,
      status: AdminStatus.Active,
    },
  });

  // Seed a Customer with a Wallet
  const customerEmail = "customer@example.com";
  let customerFirebaseUid;

  try {
    const userRecord = await admin.auth().createUser({
      email: customerEmail,
      password: "customerPassword123",
      displayName: "Customer User",
    });
    customerFirebaseUid = userRecord.uid;
  } catch (error: any) {
    if (error.code === "auth/email-already-exists") {
      console.log("Customer already exists in Firebase, fetching UID...");
      const user = await admin.auth().getUserByEmail(customerEmail);
      customerFirebaseUid = user.uid;
    } else {
      throw error;
    }
  }

  const customer = await prisma.customer.upsert({
    where: { email: customerEmail },
    update: {},
    create: {
      firebaseUid: customerFirebaseUid,
      name: "Customer User",
      email: customerEmail,
      phone: "555-555-5555",
      address: "Customer Address",
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
