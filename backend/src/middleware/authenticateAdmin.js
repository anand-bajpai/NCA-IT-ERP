import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import { hasPermission } from "../config/permissions.js";

export async function authenticateAdmin(req, res, next) {
  try {
    const token = req.cookies?.admin_token;

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authenticated. Please log in." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: "Account not found or deactivated." });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
  }
}

// Role-based guard — usage: authorizeRoles("superadmin")
export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({ success: false, message: "You don't have permission to do this." });
    }
    next();
  };
}

// Module/permission-based guard — usage: authorizeModule("students")
// Reads from the central RBAC config (config/permissions.js) so a role's
// access can be changed in one place without touching every route file.
export function authorizeModule(moduleKey) {
  return (req, res, next) => {
    if (!req.admin || !hasPermission(req.admin.role, moduleKey)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this module.",
      });
    }
    next();
  };
}
