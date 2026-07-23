// Run with: npm run create-admin
// Reads ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD from .env

import dotenv from "dotenv";
import mongoose from "mongoose";
import Admin from "../models/Admin.js";

dotenv.config();

async function run() {
  const { MONGODB_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not set in backend/.env");
    process.exit(1);
  }

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("❌ Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env before running this script.");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  console.log("Connected to MongoDB");

  const existing = await Admin.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    console.log(`⚠️  An admin with email "${ADMIN_EMAIL}" already exists. Nothing was created.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const admin = await Admin.create({
    name: ADMIN_NAME || "Admin",
    email: ADMIN_EMAIL.toLowerCase(),
    password: ADMIN_PASSWORD, // hashed automatically by the model's pre-save hook
    role: "superadmin",
  });

  console.log("✅ Admin created successfully:");
  console.log(`   Name:  ${admin.name}`);
  console.log(`   Email: ${admin.email}`);
  console.log("   You can now log in at /admin/login with this email and the password you set in .env");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Failed to create admin:", err.message);
  process.exit(1);
});
