import { validationResult } from "express-validator";
import Admin from "../models/Admin.js";
import { ALL_ROLES, ROLES, getPermissionsForRole } from "../config/permissions.js";

const toSafeAdmin = (admin) => ({
  id: admin._id,
  name: admin.name,
  email: admin.email,
  role: admin.role,
  isActive: admin.isActive,
  permissions: getPermissionsForRole(admin.role),
  createdAt: admin.createdAt,
});

// GET /api/admin/users?search=&page=&limit= — list staff accounts (Super Admin only)
export async function listAdminUsers(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const search = (req.query.search || "").trim();

    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const [admins, total] = await Promise.all([
      Admin.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Admin.countDocuments(filter),
    ]);

    res.json({
      success: true,
      users: admins.map(toSafeAdmin),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (err) {
    console.error("List admin users error:", err);
    res.status(500).json({ success: false, message: "Failed to load staff accounts." });
  }
}

// POST /api/admin/users — create a new staff account (Super Admin only)
export async function createAdminUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password, role } = req.body;

  try {
    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    const admin = await Admin.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || ROLES.ADMIN,
    });

    res.status(201).json({ success: true, user: toSafeAdmin(admin) });
  } catch (err) {
    console.error("Create admin user error:", err);
    res.status(500).json({ success: false, message: "Failed to create staff account." });
  }
}

// PUT /api/admin/users/:id — change name / role / active status (Super Admin only)
// Password changes go through resetAdminUserPassword below, kept separate so
// the two concerns (identity/role vs. credentials) don't get tangled.
export async function updateAdminUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { name, role, isActive } = req.body;
    const isSelf = id === String(req.admin._id);

    if (isSelf && isActive === false) {
      return res.status(400).json({ success: false, message: "You can't disable your own account." });
    }
    if (isSelf && role && role !== ROLES.SUPERADMIN) {
      return res.status(400).json({ success: false, message: "You can't remove your own Super Admin role." });
    }

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Staff account not found." });
    }

    if (name !== undefined) admin.name = name;
    if (role !== undefined) admin.role = role;
    if (isActive !== undefined) admin.isActive = isActive;

    await admin.save();

    res.json({ success: true, user: toSafeAdmin(admin) });
  } catch (err) {
    console.error("Update admin user error:", err);
    res.status(500).json({ success: false, message: "Failed to update staff account." });
  }
}

// PUT /api/admin/users/:id/reset-password — Super Admin sets a new password for a staff account
export async function resetAdminUserPassword(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { password } = req.body;

    const admin = await Admin.findById(id).select("+password");
    if (!admin) {
      return res.status(404).json({ success: false, message: "Staff account not found." });
    }

    admin.password = password; // re-hashed by the Admin model's pre-save hook
    await admin.save();

    res.json({ success: true, message: "Password reset successfully." });
  } catch (err) {
    console.error("Reset admin password error:", err);
    res.status(500).json({ success: false, message: "Failed to reset password." });
  }
}

// DELETE /api/admin/users/:id — remove a staff account (Super Admin only)
export async function deleteAdminUser(req, res) {
  try {
    const { id } = req.params;

    if (id === String(req.admin._id)) {
      return res.status(400).json({ success: false, message: "You can't delete your own account." });
    }

    const admin = await Admin.findByIdAndDelete(id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Staff account not found." });
    }

    res.json({ success: true, message: "Staff account removed." });
  } catch (err) {
    console.error("Delete admin user error:", err);
    res.status(500).json({ success: false, message: "Failed to delete staff account." });
  }
}

export const availableRoles = ALL_ROLES;
