import { useState, useEffect, useCallback } from "react";
import { FaSearch, FaEye, FaEdit, FaTrash, FaEnvelopeOpenText, FaCommentDots, FaUserCheck } from "react-icons/fa";
import adminApi from "../api/adminApi";
import EnquiryFormModal from "../components/EnquiryFormModal";
import EnquiryViewModal from "../components/EnquiryViewModal";
import EnquiryFollowUpModal from "../components/EnquiryFollowUpModal";
import EnquiryConvertModal from "../components/EnquiryConvertModal";
import "./AdminEnquiries.css";

const STATUS_OPTIONS = ["New", "Contacted", "Follow-up", "Converted", "Closed"];
const INQUIRY_TYPES = ["Admission", "Internship", "Corporate Training", "General"];

const AdminEnquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [inquiryType, setInquiryType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState(null);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingEnquiry, setViewingEnquiry] = useState(null);

  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [activeEnquiry, setActiveEnquiry] = useState(null);

  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertingEnquiry, setConvertingEnquiry] = useState(null);

  const fetchEnquiries = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.get("/enquiries", {
        params: { search, status, inquiryType, page, limit: 10 },
      });
      setEnquiries(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load enquiries.");
    } finally {
      setLoading(false);
    }
  }, [search, status, inquiryType]);

  useEffect(() => {
    const timer = setTimeout(() => fetchEnquiries(1), 300); // debounce search
    return () => clearTimeout(timer);
  }, [fetchEnquiries]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await adminApi.put(`/enquiries/${id}/status`, { status: newStatus });
      fetchEnquiries(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || "Could not update enquiry status.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this enquiry? This cannot be undone.")) return;
    try {
      await adminApi.delete(`/enquiries/${id}`);
      fetchEnquiries(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete enquiry.");
    }
  };

  const openEditModal = (enquiry) => {
    setEditingEnquiry(enquiry);
    setFormModalOpen(true);
  };

  const openViewModal = (enquiry) => {
    setViewingEnquiry(enquiry);
    setViewModalOpen(true);
  };

  const openFollowUpModal = async (enquiry) => {
    setActiveEnquiry(enquiry);
    setFollowUpModalOpen(true);
  };

  const refreshActiveEnquiry = async () => {
    if (!activeEnquiry) return;
    const res = await adminApi.get(`/enquiries/${activeEnquiry._id}`);
    setActiveEnquiry(res.data.data);
    fetchEnquiries(pagination.page);
  };

  const openConvertModal = (enquiry) => {
    setConvertingEnquiry(enquiry);
    setConvertModalOpen(true);
  };

  return (
    <div className="admin-enquiries">
      <div className="admin-enquiries-header">
        <div>
          <h1>Enquiries</h1>
          <p className="admin-dashboard-sub">{pagination.total} total enquiries received</p>
        </div>
      </div>

      {/* Filters */}
      <div className="enquiries-filters">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by name, email, phone, course, message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        <select value={inquiryType} onChange={(e) => setInquiryType(e.target.value)}>
          <option value="">All Types</option>
          {INQUIRY_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      {error && <p className="admin-dashboard-error">{error}</p>}

      {/* Table */}
      <div className="enquiries-table-wrap">
        <table className="enquiries-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Course</th>
              <th>Type</th>
              <th>Received</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="table-empty">Loading...</td></tr>
            ) : enquiries.length === 0 ? (
              <tr>
                <td colSpan="7" className="table-empty">
                  <FaEnvelopeOpenText style={{ marginRight: 8 }} />
                  No enquiries found.
                </td>
              </tr>
            ) : (
              enquiries.map((e) => (
                <tr key={e._id}>
                  <td>{e.fullName}</td>
                  <td>
                    {e.email && <div>{e.email}</div>}
                    {e.phone && <div>{e.phone}</div>}
                  </td>
                  <td>{e.course || "—"}</td>
                  <td>{e.inquiryType || "General"}</td>
                  <td>{new Date(e.createdAt).toLocaleDateString()}</td>
                  <td>
                    <select
                      value={e.status}
                      onChange={(ev) => handleStatusChange(e._id, ev.target.value)}
                      className={`status-select status-${e.status.toLowerCase().replace(/\s+/g, "-")}`}
                      disabled={!!e.convertedToStudent}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {e.convertedToStudent && (
                      <div className="converted-note">→ {e.convertedToStudent.fullName}</div>
                    )}
                  </td>
                  <td className="table-actions">
                    <button onClick={() => openViewModal(e)} title="View"><FaEye /></button>
                    <button onClick={() => openEditModal(e)} title="Edit"><FaEdit /></button>
                    <button onClick={() => openFollowUpModal(e)} title="Follow-up"><FaCommentDots /></button>
                    {!e.convertedToStudent && (
                      <button onClick={() => openConvertModal(e)} title="Convert to Admission" className="convert">
                        <FaUserCheck />
                      </button>
                    )}
                    <button onClick={() => handleDelete(e._id)} title="Delete" className="danger"><FaTrash /></button>
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
              onClick={() => fetchEnquiries(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <EnquiryViewModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        enquiry={viewingEnquiry}
      />

      <EnquiryFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSaved={() => fetchEnquiries(pagination.page)}
        enquiry={editingEnquiry}
      />

      <EnquiryFollowUpModal
        isOpen={followUpModalOpen}
        onClose={() => setFollowUpModalOpen(false)}
        onSaved={refreshActiveEnquiry}
        enquiry={activeEnquiry}
      />

      <EnquiryConvertModal
        isOpen={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        onConverted={() => fetchEnquiries(pagination.page)}
        enquiry={convertingEnquiry}
      />
    </div>
  );
};

export default AdminEnquiries;
