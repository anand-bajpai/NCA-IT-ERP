import { Router } from "express";
import { body } from "express-validator";
import { authenticateAdmin, authorizeModule } from "../middleware/authenticateAdmin.js";
import {
  listFeeReceipts,
  getFeeReceipt,
  getFeeReceiptSummary,
  getStudentReceiptHistory,
  createFeeReceipt,
  updateFeeReceipt,
  deleteFeeReceipt,
  downloadFeeReceiptPdf,
  emailFeeReceipt,
} from "../controllers/feeReceiptController.js";

const router = Router();

router.use(authenticateAdmin); // every route below requires a logged-in admin
router.use(authorizeModule("feeReceipts"));

const feeReceiptValidation = [
  body("studentName").trim().notEmpty().withMessage("Student name is required"),
  body("course").trim().notEmpty().withMessage("Course is required"),
  body("courseFee").isFloat({ min: 0 }).withMessage("Course fee must be a valid amount"),
  body("amountPaid").isFloat({ min: 0 }).withMessage("Amount paid must be a valid amount"),
  body("registrationFee").optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body("studyMaterialFee").optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body("otherCharges").optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body("discount").optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body("cgstPercent").optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }),
  body("sgstPercent").optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }),
  body("previouslyPaid").optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body("studentEmail").optional({ checkFalsy: true }).isEmail().withMessage("Invalid email"),
  body("paymentMode")
    .optional()
    .isIn(["Cash", "UPI", "Bank Transfer", "Card", "Cheque", "Online"])
    .withMessage("Invalid payment mode"),
];

router.get("/", listFeeReceipts);
router.get("/summary", getFeeReceiptSummary);
router.get("/history/:studentId", getStudentReceiptHistory);
router.get("/:id", getFeeReceipt);
router.get("/:id/pdf", downloadFeeReceiptPdf);
router.post("/:id/email", emailFeeReceipt);
router.post("/", feeReceiptValidation, createFeeReceipt);
router.put("/:id", feeReceiptValidation, updateFeeReceipt);
router.delete("/:id", deleteFeeReceipt);

export default router;
