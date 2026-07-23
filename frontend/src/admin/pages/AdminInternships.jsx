import { useState, useEffect, useCallback } from "react";
import { FaSearch, FaPlus, FaEdit, FaTrash, FaUserCircle } from "react-icons/fa";
import adminApi from "../api/adminApi";
import siteConfig from "../../config/siteConfig";
import InternshipFormModal from "../components/InternshipFormModal";
import "./AdminInternships.css";

const AdminInternships = () => {
  const [internships, setInternships] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingInternship, setEditingInternship] = useState(null);

  const fetchInternships = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.get("/internships", {
        params: { search, status, page, limit: 10 },
      });
      setInternships(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load internship records.");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = setTimeout(() => fetchInternships(1), 300); // debounce search
    return () => clearTimeout(timer);
  }, [fetchInternships]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this internship record? This cannot be undone.")) return;
    try {
      await adminApi.delete(`/internships/${id}`);
      fetchInternships(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete internship record.");
    }
  };

  const openAddModal = () => {
    setEditingInternship(null);
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingInternship(record);
    setModalOpen(true);
  };

  return (
    <div className="admin-internships">
      <div className="admin-internships-header">
        <div>
          <h1>Internships</h1>
          <p className="admin-dashboard-sub">{pagination.total} total internship records</p>
        </div>

        <button className="add-internship-btn" onClick={openAddModal}>
          <FaPlus /> Add Internship
        </button>
      </div>

      {/* Filters */}
      <div className="internships-filters">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by name, company, technology, project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option>Ongoing</option>
          <option>Completed</option>
          <option>Dropped</option>
        </select>
      </div>

      {error && <p className="admin-dashboard-error">{error}</p>}

      {/* Table */}
      <div className="internships-table-wrap">
        <table className="internships-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Student</th>
              <th>Company</th>
              <th>Technology</th>
              <th>Mentor</th>
              <th>Status</th>
              <th>Certificate</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="table-empty">Loading...</td></tr>
            ) : internships.length === 0 ? (
              <tr><td colSpan="8" className="table-empty">No internship records found.</td></tr>
            ) : (
              internships.map((i) => (
                <tr key={i._id}>
                  <td>
                    {i.photo ? (
                      <img src={`${siteConfig.apiBaseUrl}${i.photo}`} alt={i.studentName} className="intern-photo" />
                    ) : (
                      <FaUserCircle className="intern-photo-placeholder" />
                    )}
                  </td>
                  <td>{i.studentName}</td>
                  <td>{i.companyName}</td>
                  <td>{i.technology}</td>
                  <td>{i.mentor || "—"}</td>
                  <td>
                    <span className={`status-badge status-${i.status.toLowerCase()}`}>{i.status}</span>
                  </td>
                  <td>{i.certificateRef?.certificateNumber || "—"}</td>
                  <td className="table-actions">
                    <button onClick={() => openEditModal(i)} title="Edit"><FaEdit /></button>
                    <button onClick={() => handleDelete(i._id)} title="Delete" className="danger"><FaTrash /></button>
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
              onClick={() => fetchInternships(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <InternshipFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => fetchInternships(pagination.page)}
        internship={editingInternship}
      />
    </div>
  );
};

export default AdminInternships;
