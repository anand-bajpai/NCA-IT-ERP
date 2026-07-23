import { validationResult } from "express-validator";
import InternshipRecord from "../models/InternshipRecord.js";

// GET /api/admin/internships?search=&status=&technology=&page=1&limit=10
export async function listInternships(req, res) {
  try {
    const {
      search = "",
      status,
      technology,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (technology) filter.technology = technology;
    if (search) filter.$text = { $search: search };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const [internships, total] = await Promise.all([
      InternshipRecord.find(filter)
        .populate("certificateRef", "certificateNumber status")
        .sort({ [sortBy]: order === "asc" ? 1 : -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      InternshipRecord.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: internships,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    console.error("List internships error:", err);
    res.status(500).json({ success: false, message: "Could not fetch internship records." });
  }
}

export async function getInternship(req, res) {
  try {
    const internship = await InternshipRecord.findById(req.params.id).populate(
      "certificateRef",
      "certificateNumber status"
    );
    if (!internship) return res.status(404).json({ success: false, message: "Internship record not found." });
    res.json({ success: true, data: internship });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not fetch internship record." });
  }
}

export async function createInternship(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const payload = { ...req.body };
    if (req.file) {
      payload.photo = `/uploads/interns/${req.file.filename}`;
    }

    const internship = await InternshipRecord.create(payload);
    res.status(201).json({ success: true, data: internship });
  } catch (err) {
    console.error("Create internship error:", err);
    res.status(500).json({ success: false, message: "Could not create internship record." });
  }
}

export async function updateInternship(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const payload = { ...req.body };
    if (req.file) {
      payload.photo = `/uploads/interns/${req.file.filename}`;
    }

    const internship = await InternshipRecord.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!internship) return res.status(404).json({ success: false, message: "Internship record not found." });
    res.json({ success: true, data: internship });
  } catch (err) {
    console.error("Update internship error:", err);
    res.status(500).json({ success: false, message: "Could not update internship record." });
  }
}

export async function deleteInternship(req, res) {
  try {
    const internship = await InternshipRecord.findByIdAndDelete(req.params.id);
    if (!internship) return res.status(404).json({ success: false, message: "Internship record not found." });
    res.json({ success: true, message: "Internship record deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not delete internship record." });
  }
}
