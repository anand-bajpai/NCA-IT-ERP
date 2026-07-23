import { validationResult } from "express-validator";
import fs from "fs";
import Certificate from "../models/Certificate.js";
import Student from "../models/Student.js";
import { generateCertificateNumber, generateVerificationId } from "../utils/certificateNumber.js";
import { generateCertificateQr } from "../utils/generateCertificateQr.js";
import { buildCertificateHtml } from "../utils/certificateTemplate.js";
import { saveCertificatePdf, certificatePdfExists } from "../utils/generateCertificatePdf.js";
import { getInstituteInfo } from "../utils/instituteSettingsCache.js";
import { sendMail } from "../utils/mailer.js";
import { buildCertificateEmail, buildCertificateWhatsAppMessage } from "../utils/certificateEmailTemplate.js";
import { buildVerificationUrl } from "../utils/generateCertificateQr.js";

// Escapes user input before dropping it into a RegExp so search text like
// "NCA-CERT-2026-0001" or "+91 (999)" can't break/hijack the query.
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Builds the certificate HTML for a given certificate document, pulling in
// live Institute Settings (logo, director name, signature, stamp).
async function renderCertificateHtml(certificate) {
  const institute = await getInstituteInfo();
  const plain = certificate.toObject ? certificate.toObject() : certificate;
  return buildCertificateHtml(plain, institute);
}

// GET /api/admin/certificates/lookup-student/:admissionNumber
// Looks up a Student by Admission Number so the Certificate form can
// auto-fill Student Name, Father's Name, Course and Admission Number.
// Certificates are only ever issued to Students, so this is the sole way
// the recipient side of a certificate gets populated.
export async function lookupStudentByAdmissionNumber(req, res) {
  try {
    const admissionNumber = (req.params.admissionNumber || "").trim();
    if (!admissionNumber) {
      return res.status(400).json({ success: false, message: "Admission number is required." });
    }

    const student = await Student.findOne({ admissionNumber });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "No student found with this admission number.",
      });
    }

    res.json({
      success: true,
      data: {
        studentId: student._id,
        studentName: student.fullName,
        fatherName: student.fatherName || "",
        course: student.course,
        joiningDate: student.joiningDate || null,
        admissionNumber: student.admissionNumber,
        mobile: student.mobile,
        email: student.email,
      },
    });
  } catch (err) {
    console.error("Lookup student by admission number error:", err);
    res.status(500).json({ success: false, message: "Could not look up this admission number." });
  }
}

// ---------- ADMIN: list / search / filter / paginate ----------
// GET /api/admin/certificates?search=&status=&certificateType=&course=&batch=&page=1&limit=10
export async function listCertificates(req, res) {
  try {
    const {
      search = "",
      status,
      certificateType,
      course,
      batch,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (certificateType) filter.certificateType = certificateType;
    if (course) filter.course = course;
    if (batch) filter.batch = batch;

    // Multi-field partial-match search across the identifiers admins search by:
    // certificate number, verification ID, student name, mobile, course, status.
    if (search && search.trim()) {
      const re = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [
        { certificateNumber: re },
        { verificationId: re },
        { studentName: re },
        { mobile: re },
        { course: re },
        { status: re },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const [certificates, total] = await Promise.all([
      Certificate.find(filter)
        .sort({ [sortBy]: order === "asc" ? 1 : -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Certificate.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: certificates,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    console.error("List certificates error:", err);
    res.status(500).json({ success: false, message: "Could not fetch certificates." });
  }
}

// GET /api/admin/certificates/:id
export async function getCertificate(req, res) {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) return res.status(404).json({ success: false, message: "Certificate not found." });
    res.json({ success: true, data: certificate });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not fetch certificate." });
  }
}

// POST /api/admin/certificates
export async function createCertificate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const payload = { ...req.body };

    // Certificates are only ever issued to Students, resolved by Admission
    // Number. Student Name, Father's Name, Course and Admission Number are
    // never trusted from the client — always pulled fresh from the Student
    // record so they can't drift from the source of truth.
    const admissionNumber = (payload.admissionNumber || "").trim();
    if (!admissionNumber) {
      return res.status(400).json({ success: false, message: "Admission number is required." });
    }

    const student = await Student.findOne({ admissionNumber });
    if (!student) {
      return res.status(400).json({
        success: false,
        message: "No student found with this admission number.",
      });
    }

    payload.studentRef = student._id;
    payload.studentName = student.fullName;
    payload.fatherName = student.fatherName || "";
    payload.course = student.course;
    payload.joiningDate = student.joiningDate || null;
    payload.admissionNumber = student.admissionNumber;
    if (!payload.mobile) payload.mobile = student.mobile;
    if (!payload.email) payload.email = student.email;

    // Auto-generate certificate number / verification ID if the admin left them blank
    if (!payload.certificateNumber) {
      payload.certificateNumber = await generateCertificateNumber(payload.certificateType);
    }
    payload.verificationId = await generateVerificationId();
    payload.qrCode = await generateCertificateQr(payload.verificationId);

    const certificate = await Certificate.create(payload);
    res.status(201).json({ success: true, data: certificate });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A certificate with this number already exists.",
      });
    }
    console.error("Create certificate error:", err);
    res.status(500).json({ success: false, message: "Could not create certificate." });
  }
}

// PUT /api/admin/certificates/:id
export async function updateCertificate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const payload = { ...req.body };
    // verificationId & QR are system-generated — never let the client overwrite them
    delete payload.verificationId;
    delete payload.qrCode;
    delete payload.pdfPath;
    delete payload.pdfGeneratedAt;
    delete payload.photo;

    // If the admission number changed (or is present), re-resolve the
    // Student record so Name/Father's Name/Course/Admission Number always
    // stay in sync with the source of truth — never trusted from the client.
    if (payload.admissionNumber) {
      const admissionNumber = payload.admissionNumber.trim();
      const student = await Student.findOne({ admissionNumber });
      if (!student) {
        return res.status(400).json({
          success: false,
          message: "No student found with this admission number.",
        });
      }
      payload.studentRef = student._id;
      payload.studentName = student.fullName;
      payload.fatherName = student.fatherName || "";
      payload.course = student.course;
      payload.joiningDate = student.joiningDate || null;
      payload.admissionNumber = student.admissionNumber;
      if (!payload.mobile) payload.mobile = student.mobile;
      if (!payload.email) payload.email = student.email;
    }

    const certificate = await Certificate.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!certificate) return res.status(404).json({ success: false, message: "Certificate not found." });
    res.json({ success: true, data: certificate });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A certificate with this number already exists.",
      });
    }
    console.error("Update certificate error:", err);
    res.status(500).json({ success: false, message: "Could not update certificate." });
  }
}

// DELETE /api/admin/certificates/:id
export async function deleteCertificate(req, res) {
  try {
    const certificate = await Certificate.findByIdAndDelete(req.params.id);
    if (!certificate) return res.status(404).json({ success: false, message: "Certificate not found." });
    res.json({ success: true, message: "Certificate deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not delete certificate." });
  }
}

// POST /api/admin/certificates/:id/duplicate
// Clones an existing certificate into a brand-new record (fresh certificate
// number, verification ID and QR code) — handy for "same student, new run"
// or correcting a botched entry without retyping everything.
export async function duplicateCertificate(req, res) {
  try {
    const source = await Certificate.findById(req.params.id).lean();
    if (!source) return res.status(404).json({ success: false, message: "Certificate not found." });

    const {
      _id,
      certificateNumber,
      verificationId,
      qrCode,
      status,
      revokedAt,
      revokedReason,
      revokedBy,
      reissueOf,
      reissuedTo,
      reissueCount,
      duplicateOf,
      pdfPath,
      pdfGeneratedAt,
      createdAt,
      updatedAt,
      __v,
      ...rest
    } = source;

    const newCertificateNumber = await generateCertificateNumber(rest.certificateType);
    const newVerificationId = await generateVerificationId();
    const newQrCode = await generateCertificateQr(newVerificationId);

    const duplicate = await Certificate.create({
      ...rest,
      certificateNumber: newCertificateNumber,
      verificationId: newVerificationId,
      qrCode: newQrCode,
      status: "Valid",
      duplicateOf: source._id,
    });

    res.status(201).json({ success: true, message: "Certificate duplicated successfully.", data: duplicate });
  } catch (err) {
    console.error("Duplicate certificate error:", err);
    res.status(500).json({ success: false, message: "Could not duplicate certificate." });
  }
}

// POST /api/admin/certificates/:id/reissue
// Issues a fresh certificate (new number, verification ID, QR) to replace an
// existing one and links the two records together. The old certificate is
// marked "Reissued" so it no longer verifies as the active copy.
export async function reissueCertificate(req, res) {
  try {
    const source = await Certificate.findById(req.params.id);
    if (!source) return res.status(404).json({ success: false, message: "Certificate not found." });

    if (source.status === "Reissued") {
      return res.status(400).json({ success: false, message: "This certificate has already been reissued." });
    }

    const sourceObj = source.toObject();
    const {
      _id,
      certificateNumber,
      verificationId,
      qrCode,
      status,
      revokedAt,
      revokedReason,
      revokedBy,
      reissueOf,
      reissuedTo,
      reissueCount,
      duplicateOf,
      pdfPath,
      pdfGeneratedAt,
      createdAt,
      updatedAt,
      __v,
      ...rest
    } = sourceObj;

    // Reissue takes the requester's corrected fields (if any) over the old record
    const overrides = { ...req.body };
    delete overrides.certificateNumber;
    delete overrides.verificationId;
    delete overrides.qrCode;
    delete overrides.status;
    delete overrides.pdfPath;
    delete overrides.pdfGeneratedAt;

    const newCertificateNumber = await generateCertificateNumber(overrides.certificateType || rest.certificateType);
    const newVerificationId = await generateVerificationId();
    const newQrCode = await generateCertificateQr(newVerificationId);

    const reissued = await Certificate.create({
      ...rest,
      ...overrides,
      certificateNumber: newCertificateNumber,
      verificationId: newVerificationId,
      qrCode: newQrCode,
      status: "Valid",
      reissueOf: source._id,
      reissueCount: (source.reissueCount || 0) + 1,
    });

    source.status = "Reissued";
    source.reissuedTo = reissued._id;
    await source.save();

    res.status(201).json({
      success: true,
      message: "Certificate reissued successfully.",
      data: reissued,
      previous: source,
    });
  } catch (err) {
    console.error("Reissue certificate error:", err);
    res.status(500).json({ success: false, message: "Could not reissue certificate." });
  }
}

// PATCH /api/admin/certificates/:id/revoke
// Marks a certificate as Revoked so it fails public verification. Body may
// include an optional { reason } for the audit trail.
export async function revokeCertificate(req, res) {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) return res.status(404).json({ success: false, message: "Certificate not found." });

    if (certificate.status === "Revoked") {
      return res.status(400).json({ success: false, message: "Certificate is already revoked." });
    }

    certificate.status = "Revoked";
    certificate.revokedAt = new Date();
    certificate.revokedReason = (req.body?.reason || "").trim();
    certificate.revokedBy = req.admin?._id;
    await certificate.save();

    res.json({ success: true, message: "Certificate revoked successfully.", data: certificate });
  } catch (err) {
    console.error("Revoke certificate error:", err);
    res.status(500).json({ success: false, message: "Could not revoke certificate." });
  }
}

// GET /api/admin/certificates/:id/download — raw data for the admin to export (JSON)
export async function downloadCertificateData(req, res) {
  try {
    const certificate = await Certificate.findById(req.params.id).lean();
    if (!certificate) return res.status(404).json({ success: false, message: "Certificate not found." });

    res.setHeader("Content-Disposition", `attachment; filename="${certificate.certificateNumber}.json"`);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(certificate, null, 2));
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not download certificate data." });
  }
}

// ---------- ADMIN: Certificate Generation workflow (HTML preview -> PDF) ----------

// GET /api/admin/certificates/:id/preview — professional HTML certificate,
// meant to be loaded in an iframe (and printed from there). This is the
// "Preview Certificate" step of the admin workflow.
export async function previewCertificate(req, res) {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) return res.status(404).json({ success: false, message: "Certificate not found." });

    const html = await renderCertificateHtml(certificate);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    console.error("Preview certificate error:", err);
    res.status(500).json({ success: false, message: "Could not preview certificate." });
  }
}

// POST /api/admin/certificates/:id/generate-pdf — renders the certificate
// to a high-quality PDF, stores it in the private (non-public) file store,
// and saves the path on the Certificate document.
export async function generateCertificatePdf(req, res) {
  try {
    const certificate = await Certificate.findById(req.params.id).select("+pdfPath");
    if (!certificate) return res.status(404).json({ success: false, message: "Certificate not found." });

    const html = await renderCertificateHtml(certificate);
    const filePath = await saveCertificatePdf(certificate.certificateNumber, html);

    certificate.pdfPath = filePath;
    certificate.pdfGeneratedAt = new Date();
    await certificate.save();

    res.json({
      success: true,
      message: "Certificate PDF generated successfully.",
      data: { generatedAt: certificate.pdfGeneratedAt },
    });
  } catch (err) {
    console.error("Generate certificate PDF error:", err);
    res.status(500).json({ success: false, message: "Could not generate certificate PDF." });
  }
}

// GET /api/admin/certificates/:id/pdf — streams the generated PDF (admin only).
// Generates it on the fly if it hasn't been generated yet / the file went missing.
export async function downloadCertificatePdf(req, res) {
  try {
    const certificate = await Certificate.findById(req.params.id).select("+pdfPath");
    if (!certificate) return res.status(404).json({ success: false, message: "Certificate not found." });

    let filePath = certificate.pdfPath;
    if (!certificatePdfExists(filePath)) {
      const html = await renderCertificateHtml(certificate);
      filePath = await saveCertificatePdf(certificate.certificateNumber, html);
      certificate.pdfPath = filePath;
      certificate.pdfGeneratedAt = new Date();
      await certificate.save();
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${certificate.certificateNumber}.pdf"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error("Download certificate PDF error:", err);
    res.status(500).json({ success: false, message: "Could not download certificate PDF." });
  }
}

// ---------- PUBLIC: verification ----------
// GET /api/certificates/verify?query=<certificateNumber-or-verificationId>
export async function verifyCertificate(req, res) {
  try {
    const query = (req.query.query || "").trim();
    if (!query) {
      return res.status(400).json({ success: false, message: "Please enter a certificate number or verification ID." });
    }

    const certificate = await Certificate.findOne({
      $or: [{ certificateNumber: query }, { verificationId: query }],
    });

    if (!certificate) {
      return res.status(404).json({ success: false, message: "Invalid Certificate. No Record Found." });
    }

    // Only expose fields that are safe/relevant for public verification
    const {
      certificateNumber,
      verificationId,
      studentName,
      photo,
      course,
      joiningDate,
      duration,
      issueDate,
      certificateType,
      status,
      grade,
      organization,
      qrCode,
    } = certificate;

    res.json({
      success: true,
      valid: status === "Valid",
      data: {
        certificateNumber,
        verificationId,
        studentName,
        photo,
        course,
        joiningDate,
        duration,
        issueDate,
        certificateType,
        status,
        grade,
        organization,
        qrCode,
      },
    });
  } catch (err) {
    console.error("Verify certificate error:", err);
    res.status(500).json({ success: false, message: "Could not verify certificate right now." });
  }
}

// GET /api/certificates/:verificationId/pdf — the ONLY public route that can
// return a certificate PDF. There is no static/direct file link anywhere:
// this always re-checks the certificate's live status first and refuses to
// serve anything for a certificate that isn't currently Valid.
export async function downloadCertificatePdfPublic(req, res) {
  try {
    const { verificationId } = req.params;
    const certificate = await Certificate.findOne({ verificationId }).select("+pdfPath");

    if (!certificate) {
      return res.status(404).json({ success: false, message: "Invalid Certificate. No Record Found." });
    }
    if (certificate.status !== "Valid") {
      return res.status(403).json({
        success: false,
        message: `This certificate is currently marked as ${certificate.status} and its PDF cannot be downloaded.`,
      });
    }

    let filePath = certificate.pdfPath;
    if (!certificatePdfExists(filePath)) {
      const html = await renderCertificateHtml(certificate);
      filePath = await saveCertificatePdf(certificate.certificateNumber, html);
      certificate.pdfPath = filePath;
      certificate.pdfGeneratedAt = new Date();
      await certificate.save();
    }

    // Record the download for the admin-facing history (best-effort — a
    // logging failure must never block the actual download).
    Certificate.updateOne(
      { _id: certificate._id },
      {
        $inc: { downloadCount: 1 },
        $set: { lastDownloadedAt: new Date() },
        $push: {
          downloadHistory: {
            $each: [
              {
                downloadedAt: new Date(),
                ip: req.ip,
                userAgent: (req.headers["user-agent"] || "").slice(0, 250),
                source: "public",
              },
            ],
            $position: 0,
            $slice: 200, // cap history so the document can't grow unbounded
          },
        },
      }
    ).catch((e) => console.error("Could not record certificate download:", e.message));

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${certificate.certificateNumber}.pdf"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error("Public certificate PDF download error:", err);
    res.status(500).json({ success: false, message: "Could not download certificate PDF." });
  }
}

// ---------- ADMIN: notifications & audit ----------

// POST /api/admin/certificates/:id/send-email
// Sends (or re-sends) the professional certificate email. The PDF is never
// attached — the email carries the secure verification link + QR code and the
// recipient must verify on the website before the download is enabled.
export async function sendCertificateEmail(req, res) {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) return res.status(404).json({ success: false, message: "Certificate not found." });

    if (certificate.status === "Revoked") {
      return res.status(400).json({ success: false, message: "This certificate is revoked — email cannot be sent." });
    }

    // Recipient: explicit override in the request body, else the address
    // saved on the certificate, else the linked student record.
    let to = (req.body?.email || "").trim() || certificate.email;
    if (!to && certificate.studentRef) {
      const student = await Student.findById(certificate.studentRef).select("email");
      to = student?.email || "";
    }
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return res.status(400).json({
        success: false,
        message: "No valid recipient email found. Please provide an email address.",
      });
    }

    const institute = await getInstituteInfo();
    const { subject, html } = buildCertificateEmail(certificate.toObject(), institute);

    await sendMail({ to, subject, html });

    certificate.email = to;
    certificate.emailSentCount = (certificate.emailSentCount || 0) + 1;
    certificate.emailLastSentAt = new Date();
    certificate.emailLastSentTo = to;
    await certificate.save();

    res.json({
      success: true,
      message: `Certificate email sent to ${to}.`,
      data: {
        emailSentCount: certificate.emailSentCount,
        emailLastSentAt: certificate.emailLastSentAt,
        emailLastSentTo: certificate.emailLastSentTo,
      },
    });
  } catch (err) {
    console.error("Send certificate email error:", err);
    res.status(500).json({ success: false, message: "Could not send certificate email." });
  }
}

// GET /api/admin/certificates/:id/whatsapp-share
// Returns a wa.me deep link with the pre-filled verification message. The
// frontend opens it in a new tab (works with WhatsApp Web / mobile) — no
// WhatsApp Business API credentials required.
export async function getCertificateWhatsAppShare(req, res) {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) return res.status(404).json({ success: false, message: "Certificate not found." });

    if (certificate.status === "Revoked") {
      return res.status(400).json({ success: false, message: "This certificate is revoked — link cannot be shared." });
    }

    const institute = await getInstituteInfo();
    const message = buildCertificateWhatsAppMessage(certificate.toObject(), institute);

    // Normalise the phone number to digits only; default to +91 for local 10-digit numbers.
    let phone = (req.query.phone || certificate.mobile || "").replace(/\D/g, "");
    if (phone.length === 10) phone = `91${phone}`;

    const base = phone ? `https://wa.me/${phone}` : "https://wa.me/";
    const url = `${base}?text=${encodeURIComponent(message)}`;

    certificate.whatsappSharedCount = (certificate.whatsappSharedCount || 0) + 1;
    certificate.whatsappLastSharedAt = new Date();
    await certificate.save();

    res.json({
      success: true,
      data: {
        url,
        message,
        verificationUrl: buildVerificationUrl(certificate.verificationId),
      },
    });
  } catch (err) {
    console.error("WhatsApp share link error:", err);
    res.status(500).json({ success: false, message: "Could not build WhatsApp share link." });
  }
}

// GET /api/admin/certificates/:id/download-history
export async function getCertificateDownloadHistory(req, res) {
  try {
    const certificate = await Certificate.findById(req.params.id).select(
      "+downloadHistory certificateNumber studentName downloadCount lastDownloadedAt emailSentCount emailLastSentAt emailLastSentTo whatsappSharedCount whatsappLastSharedAt"
    );
    if (!certificate) return res.status(404).json({ success: false, message: "Certificate not found." });

    res.json({
      success: true,
      data: {
        certificateNumber: certificate.certificateNumber,
        studentName: certificate.studentName,
        downloadCount: certificate.downloadCount || 0,
        lastDownloadedAt: certificate.lastDownloadedAt,
        emailSentCount: certificate.emailSentCount || 0,
        emailLastSentAt: certificate.emailLastSentAt,
        emailLastSentTo: certificate.emailLastSentTo,
        whatsappSharedCount: certificate.whatsappSharedCount || 0,
        whatsappLastSharedAt: certificate.whatsappLastSharedAt,
        history: certificate.downloadHistory || [],
      },
    });
  } catch (err) {
    console.error("Download history error:", err);
    res.status(500).json({ success: false, message: "Could not fetch download history." });
  }
}

// GET /api/certificates/:verificationId/preview — inline HTML preview shown
// on the public verification page AFTER a successful lookup. Like the public
// PDF route, it re-validates the certificate from MongoDB and only renders
// for a certificate whose live status is "Valid" — never a static file.
export async function previewCertificatePublic(req, res) {
  try {
    const { verificationId } = req.params;
    const certificate = await Certificate.findOne({ verificationId });

    if (!certificate) {
      return res.status(404).json({ success: false, message: "Invalid Certificate. No Record Found." });
    }
    if (certificate.status !== "Valid") {
      return res.status(403).json({
        success: false,
        message: `This certificate is currently marked as ${certificate.status} and cannot be previewed.`,
      });
    }

    const html = await renderCertificateHtml(certificate);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    // The preview is meant only for embedding on our own verification page.
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.send(html);
  } catch (err) {
    console.error("Public certificate preview error:", err);
    res.status(500).json({ success: false, message: "Could not preview certificate." });
  }
}
