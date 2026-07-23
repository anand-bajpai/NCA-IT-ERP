import { Router } from "express";
import { body } from "express-validator";
import { authenticateAdmin, authorizeRoles } from "../middleware/authenticateAdmin.js";
import { ALL_ROLES, ROLES } from "../config/permissions.js";
import {
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetAdminUserPassword,
  deleteAdminUser,
} from "../controllers/adminUserController.js";

const router = Router();

// Only the Super Admin can view/manage staff accounts and roles.
router.use(authenticateAdmin);
router.use(authorizeRoles(ROLES.SUPERADMIN));

const createValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("A valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").optional().isIn(ALL_ROLES).withMessage("Invalid role"),
];

const updateValidation = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("role").optional().isIn(ALL_ROLES).withMessage("Invalid role"),
  body("isActive").optional().isBoolean().withMessage("isActive must be true/false"),
];

const resetPasswordValidation = [
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

router.get("/", listAdminUsers);
router.post("/", createValidation, createAdminUser);
router.put("/:id", updateValidation, updateAdminUser);
router.put("/:id/reset-password", resetPasswordValidation, resetAdminUserPassword);
router.delete("/:id", deleteAdminUser);

export default router;
