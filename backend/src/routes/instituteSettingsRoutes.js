import { Router } from "express";
import { body } from "express-validator";
import { authenticateAdmin, authorizeModule, authorizeRoles } from "../middleware/authenticateAdmin.js";
import { uploadInstituteAssets } from "../middleware/uploadInstituteAssets.js";
import {
  getInstituteSettings,
  updateInstituteSettings,
} from "../controllers/instituteSettingsController.js";

const router = Router();

router.use(authenticateAdmin); // every route below requires a logged-in admin
router.use(authorizeModule("settings")); // Admin: view-only. Super Admin: view + edit (enforced below).

const settingsValidation = [
  body("instituteName").optional({ checkFalsy: true }).trim().isLength({ max: 150 }),
  body("shortName").optional({ checkFalsy: true }).trim().isLength({ max: 60 }),
  body("GSTNumber")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9A-Z]{15}$/)
    .withMessage("GST Number must be a valid 15-character GSTIN"),
  body("PANNumber")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/)
    .withMessage("PAN Number must be a valid 10-character PAN"),
  body("Email").optional({ checkFalsy: true }).trim().isEmail().withMessage("Enter a valid email address"),
  body("SupportEmail").optional({ checkFalsy: true }).trim().isEmail().withMessage("Enter a valid support email address"),
  body("Website").optional({ checkFalsy: true }).trim().isURL().withMessage("Enter a valid website URL"),
  body("GoogleMapLink").optional({ checkFalsy: true }).trim().isURL().withMessage("Enter a valid Google Maps URL"),
  body("Pincode").optional({ checkFalsy: true }).trim().isLength({ max: 10 }),
  body("BankAccountName").optional({ checkFalsy: true }).trim().isLength({ max: 150 }),
  body("BankName").optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body("BankAccountNumber").optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
  body("BankIFSC")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[A-Za-z]{4}0[A-Z0-9a-z]{6}$/)
    .withMessage("IFSC Code must be a valid 11-character IFSC"),
  body("BankBranch").optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body("BankUPIId").optional({ checkFalsy: true }).trim().isLength({ max: 60 }),
];

// GET — Admin and Super Admin (view only for Admin, enforced on the frontend + write route below)
router.get("/", getInstituteSettings);

// PUT — Super Admin ONLY (the actual write-protection: even if an Admin
// somehow calls this endpoint directly, they are blocked here).
router.put(
  "/",
  authorizeRoles("superadmin"),
  uploadInstituteAssets,
  settingsValidation,
  updateInstituteSettings
);

export default router;
