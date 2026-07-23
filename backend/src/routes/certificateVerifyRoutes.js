import { Router } from "express";
import { verifyCertificate, downloadCertificatePdfPublic, previewCertificatePublic } from "../controllers/certificateController.js";

const router = Router();

// GET /api/certificates/verify?query=CERT_NUMBER_OR_VERIFICATION_ID
router.get("/verify", verifyCertificate);

// GET /api/certificates/:verificationId/pdf — the only public PDF access
// point. Gated: only serves a file when the certificate's live status is
// "Valid" (see downloadCertificatePdfPublic). No direct/static PDF links exist.
router.get("/:verificationId/pdf", downloadCertificatePdfPublic);

// GET /api/certificates/:verificationId/preview — status-gated HTML preview
// embedded on the verification page after a successful verification.
router.get("/:verificationId/preview", previewCertificatePublic);

export default router;
