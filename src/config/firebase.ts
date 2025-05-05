// src/config/firebase.ts
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

let credentials: {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {
  // Use environment variables
  credentials = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
} else {
  // Fallback to local JSON file
  const serviceAccountPath = path.resolve(__dirname, "serviceAccountKey.json");

  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      "Firebase credentials not found. Please set env vars or add serviceAccountKey.json."
    );
  }

  credentials = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
}

const firebaseApp = initializeApp({
  credential: cert(credentials),
});

const firebaseAuth = getAuth(firebaseApp);

export { firebaseAuth };
