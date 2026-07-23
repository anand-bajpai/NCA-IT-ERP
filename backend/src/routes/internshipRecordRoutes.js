import { Router } from "express";
import { body } from "express-validator";
import { authenticateAdmin, authorizeModule } from "../middleware/authenticateAdmin.js";
import { internPhotoUpload } from "../middleware/uploadInternPhoto.js";
import {
  listInternships,
  getInternship,
  createInternship,
  updateInternship,
  deleteInternship,
} from "../controllers/internshipRecordController.js";

const router = Router();

router.use(authenticateAdmin); // every route below requires a logged-in admin
router.use(authorizeModule("internships"));

const internshipValidation = [
  body("studentName").trim().notEmpty().withMessage("Student name is required"),
  body("companyName").trim().notEmpty().withMessage("Company name is required"),
  body("technology").trim().notEmpty().withMessage("Technology is required"),
  body("status").optional().isIn(["Ongoing", "Completed", "Dropped"]).withMessage("Invalid status"),
];

router.get("/", listInternships);
router.get("/:id", getInternship);
router.post("/", internPhotoUpload.single("photo"), internshipValidation, createInternship);
router.put("/:id", internPhotoUpload.single("photo"), internshipValidation, updateInternship);
router.delete("/:id", deleteInternship);

export default router;
