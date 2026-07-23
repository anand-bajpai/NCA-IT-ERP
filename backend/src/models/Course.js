import mongoose from "mongoose";

// Course Enrollment Module — a Course created/edited/deleted here is the
// single source of truth for both the admin "Course List" (Enrollments
// page) and the public website's Courses page / Course detail page.
const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },

    // URL-friendly identifier used on the public site (/courses/:slug).
    // Auto-generated from the title if left blank — see courseController.js.
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },

    image: { type: String, default: "" }, // stored /uploads/courses/xxx path

    duration: { type: String, trim: true, default: "" },
    level: { type: String, trim: true, default: "" },
    students: { type: String, trim: true, default: "" }, // display text, e.g. "500+ Students"

    originalPrice: { type: Number, default: 0 },
    discountPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },

    rating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    totalLectures: { type: Number, default: 0 },

    about: { type: String, trim: true, default: "" },
    syllabus: [{ type: String, trim: true }],
    benefits: [{ type: String, trim: true }],
    upskills: [{ type: String, trim: true }],

    // Lets an admin unpublish a course from the public website without
    // deleting its record (and its enrollment history/reporting).
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

courseSchema.index({ title: "text", about: "text" });

export default mongoose.model("Course", courseSchema);
