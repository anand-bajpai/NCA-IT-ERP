import { Router } from "express";
import { body } from "express-validator";
import { authenticateAdmin, authorizeModule } from "../middleware/authenticateAdmin.js";
import { admissionUpload } from "../middleware/uploadAdmissionDocuments.js";
import {
  listStudents,
  getStudent,
  getStudentByAdmissionNumber,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../controllers/studentController.js";

const router = Router();

router.use(authenticateAdmin); // every route below requires a logged-in admin
router.use(authorizeModule("students"));

const studentValidation = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("mobile")
    .trim()
    .matches(/^[0-9+\-\s]{7,15}$/)
    .withMessage("A valid mobile number is required"),
  body("course").trim().notEmpty().withMessage("Course is required"),
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("Invalid email"),
];

router.get("/", listStudents);
router.get("/by-admission/:admissionNumber", getStudentByAdmissionNumber);
router.get("/:id", getStudent);
router.post("/", admissionUpload, studentValidation, createStudent);
router.put("/:id", admissionUpload, studentValidation, updateStudent);
router.delete("/:id", deleteStudent);

export default router;
