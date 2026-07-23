import { Router } from "express";
import { body } from "express-validator";
import { resumeUpload } from "../middleware/upload.js";
import { submitInternshipApplication } from "../controllers/internshipController.js";

const router = Router();

router.post(
  "/",
  resumeUpload.single("resume"),
  [
    body("fullName").trim().notEmpty().withMessage("Full name is required"),
    body("email").trim().isEmail().withMessage("A valid email is required"),
    body("phone")
      .trim()
      .matches(/^[0-9+\-\s]{7,15}$/)
      .withMessage("A valid phone number is required"),
  ],
  submitInternshipApplication
);

export default router;
