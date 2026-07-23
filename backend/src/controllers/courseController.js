import fs from "fs";
import path from "path";
import Course from "../models/Course.js";

const UPLOAD_DIR = path.resolve("uploads/courses");

// Best-effort delete of a previously-uploaded course image when it's being
// replaced or the course is removed. Never throws — an orphaned file on
// disk is harmless, so failures are ignored.
function deleteStoredImage(storedPath) {
  if (!storedPath || !storedPath.startsWith("/uploads/courses/")) return;
  const filename = path.basename(storedPath);
  const fullPath = path.join(UPLOAD_DIR, filename);
  fs.unlink(fullPath, () => {});
}

function slugify(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Guarantees a unique slug by suffixing -2, -3, ... if the base slug is
// already taken (optionally excluding the course currently being edited).
async function uniqueSlug(base, excludeId) {
  let slug = base || "course";
  let counter = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await Course.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}

// Splits a textarea's newline-separated lines into a clean string array —
// used for syllabus / benefits / upskills fields submitted as multipart text.
function linesToArray(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const NUMERIC_FIELDS = ["originalPrice", "discountPrice", "discount", "rating", "totalRatings", "totalLectures"];
const TEXT_FIELDS = ["title", "duration", "level", "students", "about"];
const ARRAY_FIELDS = ["syllabus", "benefits", "upskills"];

function buildCourseFields(body) {
  const fields = {};
  TEXT_FIELDS.forEach((key) => {
    if (body[key] !== undefined) fields[key] = String(body[key]).trim();
  });
  NUMERIC_FIELDS.forEach((key) => {
    if (body[key] !== undefined && body[key] !== "") fields[key] = Number(body[key]) || 0;
  });
  ARRAY_FIELDS.forEach((key) => {
    if (body[key] !== undefined) fields[key] = linesToArray(body[key]);
  });
  if (body.isActive !== undefined) {
    fields.isActive = body.isActive === "true" || body.isActive === true;
  }
  return fields;
}

// ---------- ADMIN ----------

// GET /api/admin/enrollments/courses — full catalog for the admin panel
// (Course List grid + Add/Edit/Delete), newest first.
export async function listCoursesAdmin(req, res) {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json({ success: true, data: courses });
  } catch (err) {
    console.error("List courses (admin) error:", err);
    res.status(500).json({ success: false, message: "Could not fetch courses." });
  }
}

// GET /api/admin/enrollments/courses/:id
export async function getCourseAdmin(req, res) {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found." });
    res.json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not fetch this course." });
  }
}

// POST /api/admin/enrollments/courses
export async function createCourse(req, res) {
  try {
    const fields = buildCourseFields(req.body);
    if (!fields.title) {
      return res.status(400).json({ success: false, message: "Course title is required." });
    }

    const baseSlug = slugify(req.body.slug || fields.title);
    fields.slug = await uniqueSlug(baseSlug);

    if (req.file) {
      fields.image = `/uploads/courses/${req.file.filename}`;
    }

    const course = await Course.create(fields);
    res.status(201).json({ success: true, message: "Course created successfully.", data: course });
  } catch (err) {
    if (req.file) deleteStoredImage(`/uploads/courses/${req.file.filename}`);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "A course with this slug already exists." });
    }
    console.error("Create course error:", err);
    res.status(500).json({ success: false, message: "Could not create the course." });
  }
}

// PUT /api/admin/enrollments/courses/:id
export async function updateCourse(req, res) {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found." });

    const fields = buildCourseFields(req.body);

    if (req.body.slug !== undefined || req.body.title !== undefined) {
      const baseSlug = slugify(req.body.slug || fields.title || course.title);
      fields.slug = await uniqueSlug(baseSlug, course._id);
    }

    let oldImage = null;
    if (req.file) {
      oldImage = course.image;
      fields.image = `/uploads/courses/${req.file.filename}`;
    }

    Object.assign(course, fields);
    await course.save();

    if (oldImage) deleteStoredImage(oldImage);

    res.json({ success: true, message: "Course updated successfully.", data: course });
  } catch (err) {
    if (req.file) deleteStoredImage(`/uploads/courses/${req.file.filename}`);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "A course with this slug already exists." });
    }
    console.error("Update course error:", err);
    res.status(500).json({ success: false, message: "Could not update the course." });
  }
}

// DELETE /api/admin/enrollments/courses/:id
export async function deleteCourse(req, res) {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found." });
    if (course.image) deleteStoredImage(course.image);
    res.json({ success: true, message: "Course deleted successfully." });
  } catch (err) {
    console.error("Delete course error:", err);
    res.status(500).json({ success: false, message: "Could not delete the course." });
  }
}

// ---------- PUBLIC ----------

// GET /api/courses — active courses only, for the public website. Always
// reflects the current database contents, so a course added/edited/removed
// from the admin panel is instantly reflected here.
export async function listCoursesPublic(req, res) {
  try {
    const courses = await Course.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: courses });
  } catch (err) {
    console.error("List courses (public) error:", err);
    res.status(500).json({ success: false, message: "Could not fetch courses." });
  }
}

// GET /api/courses/:slug
export async function getCoursePublicBySlug(req, res) {
  try {
    const course = await Course.findOne({ slug: req.params.slug, isActive: true });
    if (!course) return res.status(404).json({ success: false, message: "Course not found." });
    res.json({ success: true, data: course });
  } catch (err) {
    console.error("Get course (public) error:", err);
    res.status(500).json({ success: false, message: "Could not fetch this course." });
  }
}
