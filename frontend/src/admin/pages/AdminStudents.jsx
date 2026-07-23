import { useState, useEffect, useCallback, useRef } from "react";
import { FaSearch, FaPlus, FaEdit, FaTrash, FaUserCircle, FaEllipsisV } from "react-icons/fa";
import adminApi from "../api/adminApi";
import siteConfig from "../../config/siteConfig";
import { coursesData } from "../../data/courses";
import StudentFormModal from "../components/StudentFormModal";
import RowMenuPortal from "../components/RowMenuPortal";
import "./AdminStudents.css";

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [studentType, setStudentType] = useState("");
  const [course, setCourse] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  const fetchStudents = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.get("/students", {
        params: { search, status, studentType, course, page, limit: 10 },
      });
      setStudents(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load students.");
    } finally {
      setLoading(false);
    }
  }, [search, status, studentType, course]);

  useEffect(() => {
    const timer = setTimeout(() => fetchStudents(1), 300); // debounce search
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student? This cannot be undone.")) return;
    try {
      await adminApi.delete(`/students/${id}`);
      fetchStudents(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete student.");
    }
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setModalOpen(true);
  };

  return (
    <div className="admin-students">
      <div className="admin-students-header">
        <div>
          <h1>Students</h1>
          <p className="admin-dashboard-sub">{pagination.total} total students</p>
        </div>

        <button className="add-student-btn" onClick={openAddModal}>
          <FaPlus /> Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="students-filters">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by name, mobile, email, admission no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option>Active</option>
          <option>Completed</option>
          <option>Dropped</option>
          <option>On Hold</option>
        </select>

        <select value={studentType} onChange={(e) => setStudentType(e.target.value)}>
          <option value="">All Types</option>
          <option>Regular</option>
          <option>Internship</option>
          <option>Client</option>
        </select>

        <select value={course} onChange={(e) => setCourse(e.target.value)}>
          <option value="">All Courses</option>
          {coursesData.map((c) => (
            <option key={c.id} value={c.title}>{c.title}</option>
          ))}
        </select>
      </div>

      {error && <p className="admin-dashboard-error">{error}</p>}

      {/* Table */}
      <div className="students-table-wrap">
        <table className="students-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Admission No.</th>
              <th>Student</th>
              <th>Course</th>
              <th>Mobile</th>
              <th>Type</th>
              <th>Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="table-empty">Loading...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan="8" className="table-empty">No students found.</td></tr>
            ) : (
              students.map((s) => (
                <tr key={s._id}>
                  <td>
                    {s.photo ? (
                      <img src={`${siteConfig.apiBaseUrl}${s.photo}`} alt={s.fullName} className="student-photo" />
                    ) : (
                      <FaUserCircle className="student-photo-placeholder" />
                    )}
                  </td>
                  <td>{s.admissionNumber || "—"}</td>
                  <td>
                    <div className="student-cell-text">
                      <span className="student-name">{s.fullName}</span>
                      {s.fatherName && <span className="student-sub">S/o. {s.fatherName}</span>}
                    </div>
                  </td>
                  <td>{s.course}</td>
                  <td>{s.mobile}</td>
                  <td>{s.studentType}</td>
                  <td>
                    <span className={`status-badge status-${s.status.replace(/\s+/g, "-").toLowerCase()}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="table-actions">
                    <div className="row-menu">
                      <button
                        ref={openMenuId === s._id ? menuRef : null}
                        className="row-icon-btn row-menu-trigger"
                        onClick={() => setOpenMenuId(openMenuId === s._id ? null : s._id)}
                        title="More actions"
                        aria-haspopup="true"
                        aria-expanded={openMenuId === s._id}
                      >
                        <FaEllipsisV />
                      </button>

                      <RowMenuPortal
                        anchorRef={menuRef}
                        open={openMenuId === s._id}
                        onClose={() => setOpenMenuId(null)}
                      >
                        <button role="menuitem" onClick={() => { openEditModal(s); setOpenMenuId(null); }}>
                          <FaEdit /> <span>Edit</span>
                        </button>
                        <button
                          role="menuitem"
                          className="danger"
                          onClick={() => { handleDelete(s._id); setOpenMenuId(null); }}
                        >
                          <FaTrash /> <span>Delete</span>
                        </button>
                      </RowMenuPortal>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={p === pagination.page ? "active" : ""}
              onClick={() => fetchStudents(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <StudentFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => fetchStudents(pagination.page)}
        student={editingStudent}
      />
    </div>
  );
};

export default AdminStudents;
