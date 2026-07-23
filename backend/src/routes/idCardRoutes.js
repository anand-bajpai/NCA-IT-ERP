import { Router } from "express";
import { body } from "express-validator";
import { authenticateAdmin, authorizeModule } from "../middleware/authenticateAdmin.js";
import { uploadIdCardPhoto } from "../middleware/uploadIdCardPhoto.js";
import {
  listIdCards,
  getIdCard,
  createIdCard,
  updateIdCard,
  syncIdCardFromAdmission,
  deleteIdCard,
  previewIdCard,
  generateIdCardPdf,
  downloadIdCardPdf,
} from "../controllers/idCardController.js";

const router = Router();

router.use(authenticateAdmin); // every route below requires a logged-in admin
router.use(authorizeModule("idCards"));

const idCardValidation = [
  body("bloodGroup").optional().trim().isLength({ max: 10 }).withMessage("Blood group looks too long"),
  body("emergencyContact").optional().trim().isLength({ max: 20 }).withMessage("Emergency contact looks too long"),
  body("status").optional().isIn(["Active", "Expired", "Blocked"]).withMessage("Invalid status"),
  body("validUpto").optional().isISO8601().withMessage("Invalid valid-upto date"),
  body("issueDate").optional().isISO8601().withMessage("Invalid issue date"),
];

const createValidation = [
  body().custom((_, { req }) => {
    if (!req.body.admissionNumber?.trim() && !req.body.studentRef) {
      throw new Error("Please enter an Admission Number to generate the card from");
    }
    return true;
  }),
  ...idCardValidation,
];

router.get("/", listIdCards);
router.get("/:id", getIdCard);
router.get("/:id/preview", previewIdCard);
router.post("/:id/generate-pdf", generateIdCardPdf);
router.get("/:id/pdf", downloadIdCardPdf);
router.post("/:id/sync", syncIdCardFromAdmission);
router.post("/", uploadIdCardPhoto, createValidation, createIdCard);
router.put("/:id", uploadIdCardPhoto, idCardValidation, updateIdCard);
router.delete("/:id", deleteIdCard);

export default router;
