import Student from "../models/Student.js";
import Course from "../models/Course.js";

// GET /api/admin/enrollments/stats
// Course Enrollment Module — an "enrollment" is simply a student admitted
// against a course (Student.course), so enrollment numbers are derived
// directly from the Students collection. "Total Courses" now reflects the
// real Course catalog (Course model) managed from this module.
export async function getEnrollmentStats(req, res) {
  try {
    const [courseWise, totalCourses] = await Promise.all([
      Student.aggregate([
        { $group: { _id: "$course", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Course.countDocuments(),
    ]);

    const totalEnrollments = courseWise.reduce((sum, c) => sum + c.count, 0);

    res.json({
      success: true,
      data: {
        totalEnrollments,
        totalCourses,
        courseWise: courseWise.map((c) => ({
          course: c._id || "Unspecified",
          count: c.count,
        })),
      },
    });
  } catch (err) {
    console.error("Enrollment stats error:", err);
    res.status(500).json({ success: false, message: "Could not load enrollment stats." });
  }
}

// GET /api/admin/enrollments/students?course=...&page=1&limit=10
// Students enrolled in a single course — used when an admin clicks a
// course card to drill into its enrolled-students list.
export async function listStudentsByCourse(req, res) {
  try {
    const { course, page = 1, limit = 10 } = req.query;

    if (!course || !course.trim()) {
      return res.status(400).json({ success: false, message: "Course is required." });
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const filter = { course };

    const [students, total] = await Promise.all([
      Student.find(filter)
        .select("fullName photo admissionNumber mobile email status studentType course createdAt")
        .sort({ createdAt: -1 })
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
    console.error("List students by course error:", err);
    res.status(500).json({ success: false, message: "Could not fetch students for this course." });
  }
}
