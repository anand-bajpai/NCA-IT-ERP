import { validationResult } from "express-validator";
import Student from "../models/Student.js";
import { generateAdmissionNumber } from "../utils/admissionNumber.js";

// GET /api/admin/students?search=&status=&studentType=&course=&page=1&limit=10&sortBy=createdAt&order=desc
export async function listStudents(req, res) {
  try {
    const {
      search = "",
      status,
      studentType,
      course,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (studentType) filter.studentType = studentType;
    if (course) filter.course = course;
    if (search) filter.$text = { $search: search };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const [students, total] = await Promise.all([
      Student.find(filter)
        .sort({ [sortBy]: order === "asc" ? 1 : -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Student.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: students,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    console.error("List students error:", err);
    res.status(500).json({ success: false, message: "Could not fetch students." });
  }
}

export async function getStudent(req, res) {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found." });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not fetch student." });
  }
}

// GET /api/admin/students/by-admission/:admissionNumber
// Exact (case-insensitive) lookup used to auto-fill forms — e.g. the Fee
// Receipt form fills Student Name / Father Name / Course / Mobile / Email
// as soon as the admin enters a valid admission number.
export async function getStudentByAdmissionNumber(req, res) {
  try {
    const admissionNumber = (req.params.admissionNumber || "").trim();
    if (!admissionNumber) {
      return res.status(400).json({ success: false, message: "Admission number is required." });
    }

    // Escape regex metacharacters so the lookup can't be abused as a regex injection.
    const escaped = admissionNumber.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const student = await Student.findOne({ admissionNumber: new RegExp(`^${escaped}$`, "i") });

    if (!student) {
      return res.status(404).json({ success: false, message: "No student found with this admission number." });
    }

    res.json({ success: true, data: student });
  } catch (err) {
    console.error("Get student by admission number error:", err);
    res.status(500).json({ success: false, message: "Could not fetch student." });
  }
}

export async function createStudent(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const payload = { ...req.body };

    const photoFile = req.files?.photo?.[0];
    if (photoFile) {
      payload.photo = `/uploads/students/${photoFile.filename}`;
    }

    const documentFiles = req.files?.documents || [];
    if (documentFiles.length) {
      payload.documents = documentFiles.map((f) => ({
        name: f.originalname,
        url: `/uploads/students/documents/${f.filename}`,
      }));
    }

    // Admission Number is system-generated — an admin can never set it
    // manually, so this is always populated fresh on creation.
    payload.admissionNumber = await generateAdmissionNumber();

    const student = await Student.create(payload);
    res.status(201).json({ success: true, data: student });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A student with this admission/enrollment number already exists.",
      });
    }
    console.error("Create student error:", err);
    res.status(500).json({ success: false, message: "Could not create student." });
  }
}

export async function updateStudent(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const payload = { ...req.body };

    // Admission Number is system-generated and immutable — never let an
    // edit request overwrite it, even if the field was included in the form.
    delete payload.admissionNumber;

    const photoFile = req.files?.photo?.[0];
    if (photoFile) {
      payload.photo = `/uploads/students/${photoFile.filename}`;
    }

    const existing = await Student.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Student not found." });

    let documents = existing.documents || [];

    // Optional: JSON array of document URLs the admin removed in this edit.
    if (payload.documentsToRemove) {
      try {
        const toRemove = JSON.parse(payload.documentsToRemove);
        documents = documents.filter((d) => !toRemove.includes(d.url));
      } catch {
        // ignore malformed input, keep existing documents untouched
      }
    }
    delete payload.documentsToRemove;

    const newDocumentFiles = req.files?.documents || [];
    if (newDocumentFiles.length) {
      documents = [
        ...documents,
        ...newDocumentFiles.map((f) => ({
          name: f.originalname,
          url: `/uploads/students/documents/${f.filename}`,
        })),
      ];
    }
    payload.documents = documents;

    const student = await Student.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!student) return res.status(404).json({ success: false, message: "Student not found." });
    res.json({ success: true, data: student });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A student with this admission/enrollment number already exists.",
      });
    }
    console.error("Update student error:", err);
    res.status(500).json({ success: false, message: "Could not update student." });
  }
}

export async function deleteStudent(req, res) {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found." });
    res.json({ success: true, message: "Student deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not delete student." });
  }
}
