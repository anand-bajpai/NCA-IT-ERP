import { Router } from "express";
import { body } from "express-validator";
import { submitCourseEnrollment } from "../controllers/courseEnrollmentController.js";

const router = Router();

router.post(
  "/",
  [
    body("fullName").trim().notEmpty().withMessage("Full name is required"),
    body("email").trim().isEmail().withMessage("A valid email is required"),
    body("phone")
      .trim()
      .matches(/^[0-9+\-\s]{7,15}$/)
      .withMessage("A valid phone number is required"),
    body("courseTitle").trim().notEmpty().withMessage("Course is required"),
  ],
  submitCourseEnrollment
);

export default router;
