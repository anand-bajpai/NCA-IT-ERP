import { Router } from "express";
import { listCoursesPublic, getCoursePublicBySlug } from "../controllers/courseController.js";

const router = Router();

// GET /api/courses — full active course catalog for the public website
// (Courses page). No authentication required.
router.get("/", listCoursesPublic);

// GET /api/courses/:slug — single course detail (Course Detail page).
router.get("/:slug", getCoursePublicBySlug);

export default router;
