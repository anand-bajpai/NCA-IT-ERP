import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import path from "path";

import { connectDB } from "./config/db.js";

import contactRoutes from "./routes/contactRoutes.js";
import internshipRoutes from "./routes/internshipRoutes.js";
import courseEnrollmentRoutes from "./routes/courseEnrollmentRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import feeReceiptRoutes from "./routes/feeReceiptRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import certificateVerifyRoutes from "./routes/certificateVerifyRoutes.js";
import internshipRecordRoutes from "./routes/internshipRecordRoutes.js";
import clientRecordRoutes from "./routes/clientRecordRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import instituteSettingsRoutes from "./routes/instituteSettingsRoutes.js";
import publicSettingsRoutes from "./routes/publicSettingsRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import idCardRoutes from "./routes/idCardRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import publicCourseRoutes from "./routes/publicCourseRoutes.js";

dotenv.config();

connectDB();

const app = express();

// Behind a reverse proxy (Nginx / Render / Railway) in production so
// req.ip (rate limiting + certificate download history) sees the real
// client IP instead of the proxy's.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// --- Security & parsing middleware ---
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // allow <img> of uploaded photos from the frontend origin
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true, // required so the admin_token cookie is sent/received
  })
);

// Serve uploaded student photos statically
app.use("/uploads", express.static(path.resolve("uploads")));

// --- Rate limiting: protect the mailer from spam / abuse ---
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    success: false,
    message: "Too many requests from this device. Please try again later.",
  },
});

// Separate, slightly stricter limiter for admin login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
});

// --- Public Routes ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "NCA IT Solution API" });
});

app.use("/api/contact", formLimiter, contactRoutes);
app.use("/api/internship-application", formLimiter, internshipRoutes);
app.use("/api/course-enrollment", formLimiter, courseEnrollmentRoutes);
app.use("/api/certificates", formLimiter, certificateVerifyRoutes); // public certificate verification
app.use("/api/settings", publicSettingsRoutes); // public institute settings (navbar/footer/contact/etc.)
app.use("/api/courses", publicCourseRoutes); // public course catalog — always the latest from the database

// --- Admin Panel Routes ---
app.use("/api/admin/auth/login", loginLimiter);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/students", studentRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/admin/fee-receipts", feeReceiptRoutes);
app.use("/api/admin/certificates", certificateRoutes);
app.use("/api/admin/id-cards", idCardRoutes);
app.use("/api/admin/enrollments", enrollmentRoutes);
app.use("/api/admin/internships", internshipRecordRoutes);
app.use("/api/admin/clients", clientRecordRoutes);
app.use("/api/admin/enquiries", enquiryRoutes);
app.use("/api/admin/users", adminUserRoutes); // Super Admin only — manage staff accounts & roles
app.use("/api/admin/settings/institute", instituteSettingsRoutes); // Admin: view only. Super Admin: view + edit

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// --- Central error handler (e.g. Multer file errors) ---
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`NCA IT Solution API running on port ${PORT}`);
});
