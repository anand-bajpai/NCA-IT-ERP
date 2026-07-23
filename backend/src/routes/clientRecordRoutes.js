import { Router } from "express";
import { body } from "express-validator";
import { authenticateAdmin, authorizeModule } from "../middleware/authenticateAdmin.js";
import { clientLogoUpload } from "../middleware/uploadClientLogo.js";
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} from "../controllers/clientRecordController.js";

const router = Router();

router.use(authenticateAdmin); // every route below requires a logged-in admin
router.use(authorizeModule("clients"));

const clientValidation = [
  body("clientName").trim().notEmpty().withMessage("Client name is required"),
  body("companyName").trim().notEmpty().withMessage("Company name is required"),
  body("project").trim().notEmpty().withMessage("Project name is required"),
  body("technology").trim().notEmpty().withMessage("Technology is required"),
  body("status").optional().isIn(["Ongoing", "Completed", "On Hold"]).withMessage("Invalid status"),
];

router.get("/", listClients);
router.get("/:id", getClient);
router.post("/", clientLogoUpload.single("logo"), clientValidation, createClient);
router.put("/:id", clientLogoUpload.single("logo"), clientValidation, updateClient);
router.delete("/:id", deleteClient);

export default router;
