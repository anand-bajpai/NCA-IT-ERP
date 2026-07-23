import { Router } from "express";
import { body } from "express-validator";
import { authenticateAdmin, authorizeModule } from "../middleware/authenticateAdmin.js";
import {
  listCertificates,
  getCertificate,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  downloadCertificateData,
  duplicateCertificate,
  reissueCertificate,
  revokeCertificate,
  previewCertificate,
  generateCertificatePdf,
  downloadCertificatePdf,
  sendCertificateEmail,
  getCertificateWhatsAppShare,
  getCertificateDownloadHistory,
  lookupStudentByAdmissionNumber,
} from "../controllers/certificateController.js";

const router = Router();

router.use(authenticateAdmin); // every route below requires a logged-in admin
router.use(authorizeModule("certificates"));

// Certificates are only ever issued to Students now, so only Student-facing
// types can be picked from the admin form. The remaining values are legacy —
// kept so certificates issued before this restriction keep loading/saving.
const CERTIFICATE_TYPES = [
  "Student Course Completion",
  "Internship Completion",
  "Certificate of Appreciation",
  "Certificate of Excellence",
  // Legacy values, kept so older certificates can still be edited/saved as-is
  "Client Project Completion",
  "Training",
  "Internship",
  "Client",
];

const certificateValidation = [
  body("admissionNumber").trim().notEmpty().withMessage("Admission number is required"),
  body("issueDate").notEmpty().withMessage("Issue date is required"),
  body("certificateType")
    .optional()
    .isIn(CERTIFICATE_TYPES)
    .withMessage("Invalid certificate type"),
  body("status").optional().isIn(["Valid", "Expired", "Revoked"]).withMessage("Invalid status"),
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("Invalid email address"),
];

const sendEmailValidation = [
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("Invalid recipient email address"),
];

const revokeValidation = [
  body("reason").optional().trim().isLength({ max: 300 }).withMessage("Reason must be under 300 characters"),
];

router.get("/", listCertificates);
router.get("/lookup-student/:admissionNumber", lookupStudentByAdmissionNumber);
router.get("/:id", getCertificate);
router.get("/:id/download", downloadCertificateData);
router.get("/:id/preview", previewCertificate);
router.post("/:id/generate-pdf", generateCertificatePdf);
router.get("/:id/pdf", downloadCertificatePdf);
router.post("/:id/send-email", sendEmailValidation, sendCertificateEmail);
router.get("/:id/whatsapp-share", getCertificateWhatsAppShare);
router.get("/:id/download-history", getCertificateDownloadHistory);
router.post("/", certificateValidation, createCertificate);
router.put("/:id", certificateValidation, updateCertificate);
router.post("/:id/duplicate", duplicateCertificate);
router.post("/:id/reissue", reissueCertificate);
router.patch("/:id/revoke", revokeValidation, revokeCertificate);
router.delete("/:id", deleteCertificate);

export default router;
