import { Router } from "express";
import { body } from "express-validator";
import { loginAdmin, logoutAdmin, getCurrentAdmin } from "../controllers/adminAuthController.js";
import { authenticateAdmin } from "../middleware/authenticateAdmin.js";

const router = Router();

router.post(
  "/login",
  [
    body("email").trim().isEmail().withMessage("A valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  loginAdmin
);

router.post("/logout", authenticateAdmin, logoutAdmin);
router.get("/me", authenticateAdmin, getCurrentAdmin);

export default router;
