import { Router } from "express";
import { authenticateAdmin } from "../middleware/authenticateAdmin.js";
import { getDashboardStats } from "../controllers/dashboardController.js";

const router = Router();

router.get("/stats", authenticateAdmin, getDashboardStats);

export default router;
