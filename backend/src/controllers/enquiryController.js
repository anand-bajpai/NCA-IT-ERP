import { validationResult } from "express-validator";
import Enquiry from "../models/Enquiry.js";
import Student from "../models/Student.js";
import { generateAdmissionNumber } from "../utils/admissionNumber.js";

// GET /api/admin/enquiries?search=&status=&course=&inquiryType=&page=1&limit=10&sortBy=createdAt&order=desc
export async function listEnquiries(req, res) {
  try {
    const {
      search = "",
      status,
      course,
      inquiryType,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (course) filter.course = course;
    if (inquiryType) filter.inquiryType = inquiryType;
    if (search) filter.$text = { $search: search };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const [enquiries, total] = await Promise.all([
      Enquiry.find(filter)
        .populate("convertedToStudent", "fullName admissionNumber")
        .sort({ [sortBy]: order === "asc" ? 1 : -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Enquiry.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: enquiries,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    console.error("List enquiries error:", err);
    res.status(500).json({ success: false, message: "Could not fetch enquiries." });
  }
}

// GET /api/admin/enquiries/:id
export async function getEnquiry(req, res) {
  try {
    const enquiry = await Enquiry.findById(req.params.id).populate(
      "convertedToStudent",
      "fullName admissionNumber"
    );
    if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found." });
    res.json({ success: true, data: enquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not fetch enquiry." });
  }
}

// POST /api/admin/enquiries — lets staff log an enquiry taken over phone/walk-in
export async function createEnquiry(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const {
      fullName,
      email,
      phone,
      course,
      inquiryType,
      contactMethod,
      source,
      budget,
      message,
      status,
    } = req.body;

    const enquiry = await Enquiry.create({
      fullName,
      email,
      phone,
      course,
      inquiryType,
      contactMethod,
      source,
      budget,
      message,
      status,
      createdBy: req.admin?._id,
    });

    res.status(201).json({ success: true, data: enquiry });
  } catch (err) {
    console.error("Create enquiry error:", err);
    res.status(500).json({ success: false, message: "Could not create enquiry." });
  }
}

// PUT /api/admin/enquiries/:id — edit enquiry details
export async function updateEnquiry(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const {
      fullName,
      email,
      phone,
      course,
      inquiryType,
      contactMethod,
      source,
      budget,
      message,
      status,
    } = req.body;

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { fullName, email, phone, course, inquiryType, contactMethod, source, budget, message, status },
      { new: true, runValidators: true }
    );

    if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found." });
    res.json({ success: true, data: enquiry });
  } catch (err) {
    console.error("Update enquiry error:", err);
    res.status(500).json({ success: false, message: "Could not update enquiry." });
  }
}

// PUT /api/admin/enquiries/:id/status — quick status change (e.g. from a dropdown)
export async function updateEnquiryStatus(req, res) {
  try {
    const { status } = req.body;
    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found." });
    res.json({ success: true, data: enquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not update enquiry status." });
  }
}

// POST /api/admin/enquiries/:id/followups — log a follow-up note/call/visit
export async function addFollowUp(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { note, nextFollowUpDate } = req.body;

    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found." });

    enquiry.followUps.push({ note, nextFollowUpDate: nextFollowUpDate || undefined, createdBy: req.admin?._id });
    enquiry.nextFollowUpDate = nextFollowUpDate || enquiry.nextFollowUpDate;

    // Automatically move a fresh enquiry into "Follow-up" status once it's
    // been actioned, unless staff already set a more specific status.
    if (enquiry.status === "New") enquiry.status = "Follow-up";

    await enquiry.save();
    res.status(201).json({ success: true, data: enquiry });
  } catch (err) {
    console.error("Add follow-up error:", err);
    res.status(500).json({ success: false, message: "Could not add follow-up." });
  }
}

// POST /api/admin/enquiries/:id/convert — convert an enquiry into an Admission (Student record)
export async function convertToAdmission(req, res) {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found." });

    if (enquiry.convertedToStudent) {
      return res.status(400).json({ success: false, message: "This enquiry has already been converted." });
    }

    // Fields the admission form may override/add (mobile, course, batch, etc.)
    // fall back to what's already on the enquiry.
    const {
      mobile,
      course,
      batch,
      fatherName,
      motherName,
      address,
      joiningDate,
    } = req.body || {};

    const finalMobile = mobile || enquiry.phone;
    const finalCourse = course || enquiry.course;

    if (!finalMobile || !finalCourse) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and course are required to convert this enquiry into an admission.",
      });
    }

    const student = await Student.create({
      fullName: enquiry.fullName,
      fatherName,
      motherName,
      mobile: finalMobile,
      email: enquiry.email,
      course: finalCourse,
      batch,
      address,
      joiningDate: joiningDate || new Date(),
      status: "Active",
      studentType: "Regular",
      admissionNumber: await generateAdmissionNumber(),
    });

    enquiry.status = "Converted";
    enquiry.convertedToStudent = student._id;
    enquiry.convertedAt = new Date();
    await enquiry.save();

    res.status(201).json({ success: true, data: { enquiry, student } });
  } catch (err) {
    console.error("Convert to admission error:", err);
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A student with this admission/enrollment number already exists.",
      });
    }
    res.status(500).json({ success: false, message: "Could not convert this enquiry into an admission." });
  }
}

export async function deleteEnquiry(req, res) {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found." });
    res.json({ success: true, message: "Enquiry deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not delete enquiry." });
  }
}
