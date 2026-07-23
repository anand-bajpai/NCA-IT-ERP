import { useState, useEffect, useCallback } from "react";
import {
  FaBookOpen,
  FaUserGraduate,
  FaArrowLeft,
  FaUserCircle,
  FaPlus,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import adminApi from "../api/adminApi";
import siteConfig from "../../config/siteConfig";
import CourseFormModal from "../components/CourseFormModal";
import "./AdminEnrollments.css";

const courseImageSrc = (image) =>
  image && image.startsWith("/uploads") ? `${siteConfig.apiBaseUrl}${image}` : image;

const AdminEnrollments = () => {
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalEnrollments, setTotalEnrollments] = useState(0);
  const [countsByCourse, setCountsByCourse] = useState({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  // Selected course (null = showing the course list)
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Students enrolled in the selected course
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState("");

  const fetchCourses = useCallback(async () => {
    setCoursesLoading(true);
    setError("");
    try {
      const res = await adminApi.get("/enrollments/courses");
      setCourses(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load courses.");
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminApi.get("/enrollments/stats");
      const { totalEnrollments, courseWise } = res.data.data;
      setTotalEnrollments(totalEnrollments);

      const map = {};
      courseWise.forEach((c) => {
        map[c.course] = c.count;
      });
      setCountsByCourse(map);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load enrollment stats.");
    }
  }, []);

  useEffect(() => {
    fetchCourses();
    fetchStats();
  }, [fetchCourses, fetchStats]);

  const fetchStudentsForCourse = useCallback(async (courseTitle, page = 1) => {
    setStudentsLoading(true);
    setStudentsError("");
    try {
      const res = await adminApi.get("/enrollments/students", {
        params: { course: courseTitle, page, limit: 10 },
      });
      setStudents(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setStudentsError(err.response?.data?.message || "Could not load students for this course.");
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  const openCourse = (course) => {
    setSelectedCourse(course);
    fetchStudentsForCourse(course.title, 1);
  };

  const closeCourse = () => {
    setSelectedCourse(null);
    setStudents([]);
    setStudentsError("");
  };

  const openAddModal = () => {
    setEditingCourse(null);
    setModalOpen(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setModalOpen(true);
  };

  const handleDeleteCourse = async (course) => {
    if (!window.confirm(`Delete "${course.title}"? This cannot be undone.`)) return;
    try {
      await adminApi.delete(`/enrollments/courses/${course._id}`);
      fetchCourses();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete this course.");
    }
  };

  const totalCourses = courses.length;

  return (
    <div className="admin-enrollments">
      {!selectedCourse ? (
        <>
          <div className="admin-enrollments-header">
            <div>
              <h1>Course Enrollments</h1>
              <p className="admin-dashboard-sub">
                Course-wise view of every student enrolled across your course catalog.
              </p>
            </div>

            <button className="add-course-btn" onClick={openAddModal}>
              <FaPlus /> Add Course
            </button>
          </div>

          {error && <p className="admin-dashboard-error">{error}</p>}

          {/* Top stat cards */}
          <div className="enrollment-stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: "#2563eb" }}>
                <FaBookOpen />
              </div>
              <div>
                <p className="stat-value">{coursesLoading ? "…" : totalCourses}</p>
                <p className="stat-label">Total Courses</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: "#059669" }}>
                <FaUserGraduate />
              </div>
              <div>
                <p className="stat-value">{coursesLoading ? "…" : totalEnrollments}</p>
                <p className="stat-label">Total Enrollments</p>
              </div>
            </div>
          </div>

          {/* Course list */}
          <h2 className="section-heading">Course List</h2>
          <div className="enrollment-course-grid">
            {coursesLoading ? (
              <p className="admin-dashboard-sub">Loading courses…</p>
            ) : courses.length === 0 ? (
              <p className="admin-dashboard-sub">
                No courses yet. Click "Add Course" to create one — it will appear on the public website immediately.
              </p>
            ) : (
              courses.map((course) => (
                <div key={course._id} className="enrollment-course-card">
                  <div className="enrollment-course-card-actions">
                    <button
                      type="button"
                      className="course-action-btn"
                      title="Edit course"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(course);
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      className="course-action-btn danger"
                      title="Delete course"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCourse(course);
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>

                  <button className="enrollment-course-card-body" onClick={() => openCourse(course)}>
                    {course.image ? (
                      <img src={courseImageSrc(course.image)} alt={course.title} className="enrollment-course-img" />
                    ) : (
                      <div className="enrollment-course-img enrollment-course-img-placeholder">
                        <FaBookOpen />
                      </div>
                    )}
                    <div className="enrollment-course-body">
                      <h3>{course.title}</h3>
                      <p className="enrollment-course-meta">{course.duration} • {course.level}</p>
                      <p className="enrollment-course-count">
                        <FaUserGraduate />
                        {countsByCourse[course.title] || 0} enrolled
                      </p>
                    </div>
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <button className="enrollment-back-btn" onClick={closeCourse}>
            <FaArrowLeft /> Back to courses
          </button>

          <div className="enrollment-detail-header">
            {selectedCourse.image ? (
              <img
                src={courseImageSrc(selectedCourse.image)}
                alt={selectedCourse.title}
                className="enrollment-detail-img"
              />
            ) : (
              <div className="enrollment-detail-img enrollment-course-img-placeholder">
                <FaBookOpen />
              </div>
            )}
            <div>
              <h1>{selectedCourse.title}</h1>
              <p className="admin-dashboard-sub">
                {pagination.total} student{pagination.total === 1 ? "" : "s"} enrolled • {selectedCourse.duration}
              </p>
            </div>
          </div>

          {studentsError && <p className="admin-dashboard-error">{studentsError}</p>}

          <div className="students-table-wrap">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Admission No.</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {studentsLoading ? (
                  <tr><td colSpan="6" className="table-empty">Loading...</td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan="6" className="table-empty">No students enrolled in this course yet.</td></tr>
                ) : (
                  students.map((s) => (
                    <tr key={s._id}>
                      <td>
                        {s.photo ? (
                          <img
                            src={`${siteConfig.apiBaseUrl}${s.photo}`}
                            alt={s.fullName}
                            className="student-photo"
                          />
                        ) : (
                          <FaUserCircle className="student-photo-placeholder" />
                        )}
                      </td>
                      <td>{s.admissionNumber || "—"}</td>
                      <td>{s.fullName}</td>
                      <td>{s.mobile}</td>
                      <td>{s.studentType}</td>
                      <td>
                        <span className={`status-badge status-${s.status.replace(/\s+/g, "-").toLowerCase()}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={p === pagination.page ? "active" : ""}
                  onClick={() => fetchStudentsForCourse(selectedCourse.title, p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <CourseFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          fetchCourses();
          fetchStats();
        }}
        course={editingCourse}
      />
    </div>
  );
};

export default AdminEnrollments;
