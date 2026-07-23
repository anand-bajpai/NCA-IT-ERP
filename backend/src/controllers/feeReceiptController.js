import { validationResult } from "express-validator";
import FeeReceipt from "../models/FeeReceipt.js";
import Student from "../models/Student.js";
import { generateReceiptNumber } from "../utils/receiptNumber.js";
import { streamFeeReceiptPdf, buildFeeReceiptPdfBuffer } from "../utils/generateFeeReceiptPdf.js";
import { amountToWords } from "../utils/numberToWords.js";
import { sendMail } from "../utils/mailer.js";
import { getInstituteInfo } from "../utils/instituteSettingsCache.js";

// Computes subtotal / GST / grand total / balance / amount-in-words from raw form fields.
function computeAmounts(body) {
  const courseFee = Number(body.courseFee) || 0;
  const registrationFee = Number(body.registrationFee) || 0;
  const studyMaterialFee = Number(body.studyMaterialFee) || 0;
  const otherCharges = Number(body.otherCharges) || 0;
  const discount = Number(body.discount) || 0;

  const subtotal = Math.max(0, courseFee + registrationFee + studyMaterialFee + otherCharges - discount);

  const cgstPercent = Number(body.cgstPercent) || 0;
  const sgstPercent = Number(body.sgstPercent) || 0;
  const cgstAmount = Math.round((subtotal * cgstPercent) / 100 * 100) / 100;
  const sgstAmount = Math.round((subtotal * sgstPercent) / 100 * 100) / 100;

  const grandTotal = Math.round((subtotal + cgstAmount + sgstAmount) * 100) / 100;

  const previouslyPaid = Number(body.previouslyPaid) || 0;
  const amountPaid = Number(body.amountPaid) || 0;
  const balanceDue = Math.max(0, Math.round((grandTotal - previouslyPaid - amountPaid) * 100) / 100);

  return {
    courseFee,
    registrationFee,
    studyMaterialFee,
    otherCharges,
    discount,
    subtotal,
    cgstPercent,
    sgstPercent,
    cgstAmount,
    sgstAmount,
    grandTotal,
    previouslyPaid,
    amountPaid,
    balanceDue,
    amountInWords: amountToWords(grandTotal),
  };
}

// GET /api/admin/fee-receipts?search=&student=&course=&paymentMode=&status=&dateFrom=&dateTo=&page=1&limit=10
export async function listFeeReceipts(req, res) {
  try {
    const {
      search = "",
      student,
      course,
      paymentMode,
      status, // "paid" | "pending"
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};
    if (student) filter.student = student;
    if (search) filter.$text = { $search: search };
    if (course) filter.course = course;
    if (paymentMode) filter.paymentMode = paymentMode;
    if (status === "paid") filter.balanceDue = { $lte: 0 };
    if (status === "pending") filter.balanceDue = { $gt: 0 };
    if (dateFrom || dateTo) {
      filter.paymentDate = {};
      if (dateFrom) filter.paymentDate.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        filter.paymentDate.$lte = end;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const [receipts, total] = await Promise.all([
      FeeReceipt.find(filter)
        .sort({ [sortBy]: order === "asc" ? 1 : -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      FeeReceipt.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: receipts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    console.error("List fee receipts error:", err);
    res.status(500).json({ success: false, message: "Could not fetch fee receipts." });
  }
}

// GET /api/admin/fee-receipts/summary — totals used by the stat cards and
// the "Pending Fees" tab. Mirrors the same collected/pending logic used on
// the main dashboard (see dashboardController.js) so figures stay consistent.
export async function getFeeReceiptSummary(req, res) {
  try {
    const [agg] = await FeeReceipt.aggregate([
      {
        $group: {
          _id: null,
          totalReceipts: { $sum: 1 },
          totalCollected: { $sum: "$amountPaid" },
          totalPending: { $sum: "$balanceDue" },
          pendingCount: { $sum: { $cond: [{ $gt: ["$balanceDue", 0] }, 1, 0] } },
          paidCount: { $sum: { $cond: [{ $lte: ["$balanceDue", 0] }, 1, 0] } },
        },
      },
    ]);

    res.json({
      success: true,
      data: agg
        ? {
            totalReceipts: agg.totalReceipts,
            totalCollected: agg.totalCollected,
            totalPending: agg.totalPending,
            pendingCount: agg.pendingCount,
            paidCount: agg.paidCount,
          }
        : { totalReceipts: 0, totalCollected: 0, totalPending: 0, pendingCount: 0, paidCount: 0 },
    });
  } catch (err) {
    console.error("Fee receipt summary error:", err);
    res.status(500).json({ success: false, message: "Could not fetch fee receipt summary." });
  }
}

export async function getFeeReceipt(req, res) {
  try {
    const receipt = await FeeReceipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ success: false, message: "Fee receipt not found." });
    res.json({ success: true, data: receipt });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not fetch fee receipt." });
  }
}

// GET /api/admin/fee-receipts/history/:studentId — every receipt issued to one student
export async function getStudentReceiptHistory(req, res) {
  try {
    const receipts = await FeeReceipt.find({ student: req.params.studentId }).sort({ paymentDate: -1 });
    res.json({ success: true, data: receipts });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not fetch receipt history." });
  }
}

export async function createFeeReceipt(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const {
      student,
      studentName,
      fatherName,
      mobile,
      studentEmail,
      admissionNumber,
      course,
      batch,
      paymentMode,
      transactionId,
      paymentDate,
      remarks,
    } = req.body;

    if (student) {
      const studentDoc = await Student.findById(student);
      if (!studentDoc) {
        return res.status(400).json({ success: false, message: "Selected student not found." });
      }
    }

    const amounts = computeAmounts(req.body);
    const receiptNumber = await generateReceiptNumber();

    const receipt = await FeeReceipt.create({
      receiptNumber,
      student: student || undefined,
      studentName,
      fatherName,
      mobile,
      studentEmail,
      admissionNumber,
      course,
      batch,
      paymentMode,
      transactionId,
      paymentDate: paymentDate || Date.now(),
      remarks,
      ...amounts,
      createdBy: req.admin?._id,
    });

    res.status(201).json({ success: true, data: receipt });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Receipt number collision, please try saving again.",
      });
    }
    console.error("Create fee receipt error:", err);
    res.status(500).json({ success: false, message: "Could not create fee receipt." });
  }
}

export async function updateFeeReceipt(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const {
      studentName,
      fatherName,
      mobile,
      studentEmail,
      admissionNumber,
      course,
      batch,
      paymentMode,
      transactionId,
      paymentDate,
      remarks,
    } = req.body;

    const amounts = computeAmounts(req.body);

    const receipt = await FeeReceipt.findByIdAndUpdate(
      req.params.id,
      {
        studentName,
        fatherName,
        mobile,
        studentEmail,
        admissionNumber,
        course,
        batch,
        paymentMode,
        transactionId,
        paymentDate,
        remarks,
        ...amounts,
      },
      { new: true, runValidators: true }
    );

    if (!receipt) return res.status(404).json({ success: false, message: "Fee receipt not found." });
    res.json({ success: true, data: receipt });
  } catch (err) {
    console.error("Update fee receipt error:", err);
    res.status(500).json({ success: false, message: "Could not update fee receipt." });
  }
}

export async function deleteFeeReceipt(req, res) {
  try {
    const receipt = await FeeReceipt.findByIdAndDelete(req.params.id);
    if (!receipt) return res.status(404).json({ success: false, message: "Fee receipt not found." });
    res.json({ success: true, message: "Fee receipt deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not delete fee receipt." });
  }
}

// GET /api/admin/fee-receipts/:id/pdf
export async function downloadFeeReceiptPdf(req, res) {
  try {
    const receipt = await FeeReceipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ success: false, message: "Fee receipt not found." });
    await streamFeeReceiptPdf(receipt, res);
  } catch (err) {
    console.error("Fee receipt PDF error:", err);
    res.status(500).json({ success: false, message: "Could not generate PDF." });
  }
}

// POST /api/admin/fee-receipts/:id/email
export async function emailFeeReceipt(req, res) {
  try {
    const receipt = await FeeReceipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ success: false, message: "Fee receipt not found." });

    if (!receipt.studentEmail) {
      return res.status(400).json({ success: false, message: "No email address saved for this student." });
    }

    const [pdfBuffer, institute] = await Promise.all([
      buildFeeReceiptPdfBuffer(receipt),
      getInstituteInfo(),
    ]);

    await sendMail({
      to: receipt.studentEmail,
      subject: `Fee Receipt ${receipt.receiptNumber} — ${institute.instituteName}`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;">
          <p>Dear ${receipt.studentName},</p>
          <p>Thank you for your payment. Please find your fee receipt <strong>${receipt.receiptNumber}</strong> attached to this email.</p>
          <p>Amount Paid: <strong>Rs. ${Number(receipt.amountPaid).toLocaleString("en-IN")}</strong></p>
          <p>Balance Due: <strong>Rs. ${Number(receipt.balanceDue).toLocaleString("en-IN")}</strong></p>
          <p style="margin-top:20px;">Regards,<br/>${institute.instituteName}</p>
        </div>
      `,
      attachments: [
        {
          filename: `${receipt.receiptNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    receipt.emailSent = true;
    receipt.emailSentAt = new Date();
    await receipt.save();

    res.json({ success: true, message: "Receipt emailed successfully.", data: receipt });
  } catch (err) {
    console.error("Email fee receipt error:", err);
    res.status(500).json({ success: false, message: "Could not send email. Check email configuration in .env." });
  }
}
