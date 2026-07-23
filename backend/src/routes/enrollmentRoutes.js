import { Router } from "express";
import { authenticateAdmin, authorizeModule } from "../middleware/authenticateAdmin.js";
import { uploadCoursePhoto } from "../middleware/uploadCoursePhoto.js";
import { getEnrollmentStats, listStudentsByCourse } from "../controllers/enrollmentController.js";
import {
  listCoursesAdmin,
  getCourseAdmin,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/courseController.js";

const router = Router();

router.use(authenticateAdmin); // every route below requires a logged-in admin
router.use(authorizeModule("enrollments"));

router.get("/stats", getEnrollmentStats);
router.get("/students", listStudentsByCourse);

// Course catalog management (Add / Edit / Delete) — the same courses
// created here automatically appear on the public website via the
// public course routes (courseController.js listCoursesPublic/getCoursePublicBySlug).
router.get("/courses", listCoursesAdmin);
router.get("/courses/:id", getCourseAdmin);
router.post("/courses", uploadCoursePhoto, createCourse);
router.put("/courses/:id", uploadCoursePhoto, updateCourse);
router.delete("/courses/:id", deleteCourse);

export default router;
