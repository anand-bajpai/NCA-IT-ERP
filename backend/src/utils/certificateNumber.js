import crypto from "crypto";
import Certificate from "../models/Certificate.js";

// Certificate-number prefix per certificate type — keeps numbers scannable
// at a glance (NCA-CERT-... vs NCA-INT-... etc.) while every type still
// shares the same yearly-sequence + collision-check logic below.
export const CERTIFICATE_TYPE_PREFIX = {
  "Student Course Completion": "CERT",
  "Internship Completion": "INT",
  "Client Project Completion": "CLI",
  "Certificate of Appreciation": "APR",
  "Certificate of Excellence": "EXC",
  // Legacy values, kept for certificates issued before this module was extended.
  Training: "CERT",
  Internship: "INT",
  Client: "CLI",
};

// Generates certificate numbers like NCA-CERT-2026-0001, unique per calendar
// year AND per certificate-type prefix.
export async function generateCertificateNumber(certificateType = "Student Course Completion") {
  const year = new Date().getFullYear();
  const code = CERTIFICATE_TYPE_PREFIX[certificateType] || "CERT";
  const prefix = `NCA-${code}-${year}-`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const countThisYear = await Certificate.countDocuments({
      certificateNumber: { $regex: `^${prefix}` },
    });

    const nextSeq = countThisYear + 1 + attempt;
    const candidate = `${prefix}${String(nextSeq).padStart(4, "0")}`;

    const exists = await Certificate.exists({ certificateNumber: candidate });
    if (!exists) return candidate;
  }

  return `${prefix}${Date.now()}`;
}

// Generates a short, hard-to-guess public verification ID, e.g. NCA-VR-8F2C1A9D
export async function generateVerificationId() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `NCA-VR-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
    const exists = await Certificate.exists({ verificationId: candidate });
    if (!exists) return candidate;
  }
  return `NCA-VR-${Date.now().toString(36).toUpperCase()}`;
}
