import { validationResult } from "express-validator";
import Admin from "../models/Admin.js";
import { generateToken, setTokenCookie, clearTokenCookie } from "../utils/token.js";
import { getPermissionsForRole } from "../config/permissions.js";

export async function loginAdmin(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select("+password");

    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = generateToken(admin);
    setTokenCookie(res, token);

    return res.json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: getPermissionsForRole(admin.role),
      },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ success: false, message: "Login failed. Please try again." });
  }
}

export function logoutAdmin(req, res) {
  clearTokenCookie(res);
  res.json({ success: true, message: "Logged out successfully." });
}

export function getCurrentAdmin(req, res) {
  const { _id, name, email, role } = req.admin;
  res.json({
    success: true,
    admin: { id: _id, name, email, role, permissions: getPermissionsForRole(role) },
  });
}
