import { Router } from "express";
import { getPublicInstituteSettings } from "../controllers/instituteSettingsController.js";

const router = Router();

// GET /api/settings/public — safe subset of institute settings for the
// public website (Navbar, Footer, Contact page, certificate verification,
// future ID cards). No authentication required.
router.get("/public", getPublicInstituteSettings);

export default router;
