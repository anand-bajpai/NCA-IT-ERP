import { Router } from "express";
import { body } from "express-validator";
import { authenticateAdmin, authorizeModule } from "../middleware/authenticateAdmin.js";
import {
  listEnquiries,
  getEnquiry,
  createEnquiry,
  updateEnquiry,
  updateEnquiryStatus,
  addFollowUp,
  convertToAdmission,
  deleteEnquiry,
} from "../controllers/enquiryController.js";

const router = Router();

router.use(authenticateAdmin); // every route below requires a logged-in admin
router.use(authorizeModule("contacts"));

const enquiryValidation = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("phone").optional({ checkFalsy: true }).trim(),
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("Invalid email"),
];

const followUpValidation = [
  body("note").trim().notEmpty().withMessage("A follow-up note is required"),
  body("nextFollowUpDate").optional({ checkFalsy: true }).isISO8601().withMessage("Invalid date"),
];

router.get("/", listEnquiries);
router.get("/:id", getEnquiry);
router.post("/", enquiryValidation, createEnquiry);
router.put("/:id", enquiryValidation, updateEnquiry);
router.put("/:id/status", updateEnquiryStatus);
router.post("/:id/followups", followUpValidation, addFollowUp);
router.post("/:id/convert", convertToAdmission);
router.delete("/:id", deleteEnquiry);

export default router;
