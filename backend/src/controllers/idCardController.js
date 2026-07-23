import { validationResult } from "express-validator";
import fs from "fs";
import IdCard from "../models/IdCard.js";
import Student from "../models/Student.js";
import { generateIdCardNumber } from "../utils/idCardNumber.js";
import { generateIdCardQr } from "../utils/generateIdCardQr.js";
import { buildIdCardHtml } from "../utils/idCardTemplate.js";
import { saveIdCardPdf, idCardPdfExists } from "../utils/generateIdCardPdf.js";
import { getInstituteInfo } from "../utils/instituteSettingsCache.js";

// Escapes user input before dropping it into a RegExp so search text can't
// break/hijack the query (mirrors the Certificate module's helper).
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function oneYearFromNow() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

// Copies the fields an ID card pulls straight from the student's admission
// record. Used both on create and on the explicit "Sync from Admission" action.
function admissionFields(student) {
  return {
    studentName: student.fullName,
    fatherName: student.fatherName || "",
    mobile: student.mobile || "",
    email: student.email || "",
    address: student.address || "",
    course: student.course,
    batch: student.batch || "",
    admissionNumber: student.admissionNumber || "",
    photo: student.photo || "",
  };
}

async function renderIdCardHtml(idCard) {
  const institute = await getInstituteInfo();
  const plain = idCard.toObject ? idCard.toObject() : idCard;
  return buildIdCardHtml(plain, institute);
}

// ---------- list / search / filter / paginate ----------
// GET /api/admin/id-cards?search=&status=&course=&batch=&page=1&limit=10
export async function listIdCards(req, res) {
  try {
    const {
      search = "",
      status,
      course,
      batch,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (course) filter.course = course;
    if (batch) filter.batch = batch;

    if (search && search.trim()) {
      const re = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [
        { idCardNumber: re },
        { studentName: re },
        { mobile: re },
        { admissionNumber: re },
        { course: re },
        { batch: re },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const [idCards, total] = await Promise.all([
      IdCard.find(filter)
        .sort({ [sortBy]: order === "asc" ? 1 : -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      IdCard.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: idCards,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    console.error("List ID cards error:", err);
    res.status(500).json({ success: false, message: "Could not fetch ID cards." });
  }
}

// GET /api/admin/id-cards/:id
export async function getIdCard(req, res) {
  try {
    const idCard = await IdCard.findById(req.params.id);
    if (!idCard) return res.status(404).json({ success: false, message: "ID card not found." });
    res.json({ success: true, data: idCard });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not fetch ID card." });
  }
}

// POST /api/admin/id-cards
// Body must include studentRef — every card is generated FROM an admission
// (Student) record. Fields not explicitly overridden in the body are pulled
// straight from that record.
export async function createIdCard(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { studentRef, admissionNumber } = req.body;

    // A card can be generated either by picking an admission record
    // (studentRef) or by typing an Admission Number directly — the primary
    // flow for this module. Admission Number takes precedence when both
    // happen to be present.
    let student = null;
    if (admissionNumber && admissionNumber.trim()) {
      const escaped = admissionNumber.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      student = await Student.findOne({ admissionNumber: new RegExp(`^${escaped}$`, "i") });
      if (!student) {
        return res.status(404).json({ success: false, message: "No admission record found with this Admission Number." });
      }
    } else if (studentRef) {
      student = await Student.findById(studentRef);
      if (!student) {
        return res.status(404).json({ success: false, message: "Selected admission record was not found." });
      }
    } else {
      return res.status(400).json({ success: false, message: "Please enter an Admission Number to generate the card from." });
    }

    const payload = {
      ...admissionFields(student),
      studentRef: student._id,
      bloodGroup: req.body.bloodGroup || "",
      emergencyContact: req.body.emergencyContact || "",
      issueDate: req.body.issueDate || new Date(),
      validUpto: req.body.validUpto || oneYearFromNow(),
      status: req.body.status || "Active",
    };

    // Explicit overrides from the form take precedence over the admission record.
    if (req.body.address) payload.address = req.body.address;
    if (req.body.mobile) payload.mobile = req.body.mobile;
    if (req.body.email) payload.email = req.body.email;

    if (req.file) {
      payload.photo = `/uploads/idcards/photos/${req.file.filename}`;
    }

    payload.idCardNumber = await generateIdCardNumber();

    const idCard = new IdCard(payload);
    idCard.qrCode = await generateIdCardQr(idCard.toObject());
    await idCard.save();

    res.status(201).json({ success: true, data: idCard });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "An ID card with this number already exists." });
    }
    console.error("Create ID card error:", err);
    res.status(500).json({ success: false, message: "Could not create ID card." });
  }
}

// PUT /api/admin/id-cards/:id
export async function updateIdCard(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const idCard = await IdCard.findById(req.params.id);
    if (!idCard) return res.status(404).json({ success: false, message: "ID card not found." });

    const payload = { ...req.body };
    delete payload.idCardNumber; // system-generated — never editable
    delete payload.qrCode;
    delete payload.pdfPath;
    delete payload.pdfGeneratedAt;
    delete payload.studentRef; // the linked admission record can't be swapped after the fact

    if (req.file) {
      payload.photo = `/uploads/idcards/photos/${req.file.filename}`;
    }

    Object.assign(idCard, payload);

    // Regenerate the QR whenever the data it encodes could have changed, and
    // invalidate any previously generated PDF so the next download reflects
    // the update.
    idCard.qrCode = await generateIdCardQr(idCard.toObject());
    idCard.pdfPath = "";
    idCard.pdfGeneratedAt = undefined;

    await idCard.save();
    res.json({ success: true, data: idCard });
  } catch (err) {
    console.error("Update ID card error:", err);
    res.status(500).json({ success: false, message: "Could not update ID card." });
  }
}

// POST /api/admin/id-cards/:id/sync — re-pulls name/photo/course/batch/etc.
// straight from the linked admission record, in case it changed since the
// card was generated.
export async function syncIdCardFromAdmission(req, res) {
  try {
    const idCard = await IdCard.findById(req.params.id);
    if (!idCard) return res.status(404).json({ success: false, message: "ID card not found." });

    const student = await Student.findById(idCard.studentRef);
    if (!student) {
      return res.status(404).json({ success: false, message: "Linked admission record no longer exists." });
    }

    Object.assign(idCard, admissionFields(student));
    idCard.qrCode = await generateIdCardQr(idCard.toObject());
    idCard.pdfPath = "";
    idCard.pdfGeneratedAt = undefined;

    await idCard.save();
    res.json({ success: true, data: idCard, message: "Synced with the latest admission data." });
  } catch (err) {
    console.error("Sync ID card error:", err);
    res.status(500).json({ success: false, message: "Could not sync ID card with admission data." });
  }
}

// DELETE /api/admin/id-cards/:id
export async function deleteIdCard(req, res) {
  try {
    const idCard = await IdCard.findByIdAndDelete(req.params.id);
    if (!idCard) return res.status(404).json({ success: false, message: "ID card not found." });
    res.json({ success: true, message: "ID card deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not delete ID card." });
  }
}

// GET /api/admin/id-cards/:id/preview — inline HTML (front + back) for the
// admin preview modal / print.
export async function previewIdCard(req, res) {
  try {
    const idCard = await IdCard.findById(req.params.id);
    if (!idCard) return res.status(404).json({ success: false, message: "ID card not found." });

    const html = await renderIdCardHtml(idCard);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.send(html);
  } catch (err) {
    console.error("ID card preview error:", err);
    res.status(500).json({ success: false, message: "Could not preview ID card." });
  }
}

// POST /api/admin/id-cards/:id/generate-pdf
export async function generateIdCardPdf(req, res) {
  try {
    const idCard = await IdCard.findById(req.params.id);
    if (!idCard) return res.status(404).json({ success: false, message: "ID card not found." });

    const html = await renderIdCardHtml(idCard);
    const filePath = await saveIdCardPdf(idCard.idCardNumber, html);

    idCard.pdfPath = filePath;
    idCard.pdfGeneratedAt = new Date();
    await idCard.save();

    res.json({ success: true, message: "ID card PDF generated.", data: { pdfGeneratedAt: idCard.pdfGeneratedAt } });
  } catch (err) {
    console.error("Generate ID card PDF error:", err);
    res.status(500).json({ success: false, message: "Could not generate ID card PDF." });
  }
}

// GET /api/admin/id-cards/:id/pdf — downloads the PDF, generating it on the
// fly first if it hasn't been generated yet (or was invalidated by an edit).
export async function downloadIdCardPdf(req, res) {
  try {
    const idCard = await IdCard.findById(req.params.id).select("+pdfPath");
    if (!idCard) return res.status(404).json({ success: false, message: "ID card not found." });

    let filePath = idCard.pdfPath;
    if (!idCardPdfExists(filePath)) {
      const html = await renderIdCardHtml(idCard);
      filePath = await saveIdCardPdf(idCard.idCardNumber, html);
      idCard.pdfPath = filePath;
      idCard.pdfGeneratedAt = new Date();
      await idCard.save();
    }

    idCard.downloadCount = (idCard.downloadCount || 0) + 1;
    idCard.lastDownloadedAt = new Date();
    await idCard.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${idCard.idCardNumber}.pdf"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error("Download ID card PDF error:", err);
    res.status(500).json({ success: false, message: "Could not download ID card PDF." });
  }
}
