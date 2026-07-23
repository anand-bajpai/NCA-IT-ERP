import { useState, useEffect, useCallback, useRef } from "react";
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaQrcode,
  FaEye,
  FaPrint,
  FaIdBadge,
  FaSyncAlt,
  FaDownload,
  FaEllipsisV,
} from "react-icons/fa";
import adminApi from "../api/adminApi";
import siteConfig from "../../config/siteConfig";
import IdCardFormModal from "../components/IdCardFormModal";
import IdCardPreviewModal from "../components/IdCardPreviewModal";
import RowMenuPortal from "../components/RowMenuPortal";
import "./AdminIdCards.css";

const AdminIdCards = () => {
  const [idCards, setIdCards] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [course, setCourse] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [previewCard, setPreviewCard] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [actionBusyId, setActionBusyId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  const fetchIdCards = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.get("/id-cards", {
        params: { search, status, course, page, limit: 10 },
      });
      setIdCards(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load ID cards.");
    } finally {
      setLoading(false);
    }
  }, [search, status, course]);

  useEffect(() => {
    const timer = setTimeout(() => fetchIdCards(1), 300); // debounce search
    return () => clearTimeout(timer);
  }, [fetchIdCards]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this ID card? This cannot be undone.")) return;
    try {
      await adminApi.delete(`/id-cards/${id}`);
      fetchIdCards(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete the ID card.");
    }
  };

  const handleSync = async (id) => {
    setActionBusyId(id);
    try {
      await adminApi.post(`/id-cards/${id}/sync`);
      fetchIdCards(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || "Could not sync with admission data.");
    } finally {
      setActionBusyId(null);
    }
  };

  const handleQuickDownload = async (card) => {
    setActionBusyId(card._id);
    try {
      const res = await adminApi.get(`/id-cards/${card._id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${card.idCardNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Could not download the ID card PDF.");
    } finally {
      setActionBusyId(null);
    }
  };

  const openAddModal = () => {
    setEditingCard(null);
    setModalOpen(true);
  };

  const openEditModal = (card) => {
    setEditingCard(card);
    setModalOpen(true);
  };

  const getInitials = (name) =>
    (name || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?";

  return (
    <div className="admin-idcards">
      <div className="admin-idcards-header">
        <div>
          <h1>ID Cards</h1>
          <p className="admin-dashboard-sub">{pagination.total} total ID cards</p>
        </div>

        <button className="add-idcard-btn" onClick={openAddModal}>
          <FaPlus /> Generate ID Card
        </button>
      </div>

      {/* Filters */}
      <div className="idcards-filters">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by ID card no., student, mobile, admission no., course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option>Active</option>
          <option>Expired</option>
          <option>Blocked</option>
        </select>

        <input
          type="text"
          className="course-filter"
          placeholder="Filter by course"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
        />
      </div>

      {error && <p className="admin-dashboard-error">{error}</p>}

      {/* Table */}
      <div className="idcards-table-wrap">
        <table className="idcards-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>ID Card No.</th>
              <th>Course</th>
              <th>Batch</th>
              <th>Admission No.</th>
              <th>Valid Upto</th>
              <th>Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="table-empty">
                <span className="table-empty-spinner" aria-hidden="true" />
                Loading ID cards…
              </td></tr>
            ) : idCards.length === 0 ? (
              <tr><td colSpan="8" className="table-empty">
                <FaIdBadge className="table-empty-icon" aria-hidden="true" />
                No ID cards found. Generate one from an admission record.
              </td></tr>
            ) : (
              idCards.map((c) => (
                <tr key={c._id}>
                  <td>
                    <div className="student-cell">
                      {c.photo ? (
                        <img src={`${siteConfig.apiBaseUrl}${c.photo}`} alt={c.studentName} className="student-photo-thumb" />
                      ) : (
                        <span className="student-avatar" aria-hidden="true">{getInitials(c.studentName)}</span>
                      )}
                      <div className="student-cell-text">
                        <span className="student-name">{c.studentName}</span>
                        {c.mobile && <span className="student-sub">{c.mobile}</span>}
                      </div>
                    </div>
                  </td>
                  <td><span className="idcard-number">{c.idCardNumber}</span></td>
                  <td>{c.course}</td>
                  <td>{c.batch || "—"}</td>
                  <td>{c.admissionNumber || "—"}</td>
                  <td>{c.validUpto ? new Date(c.validUpto).toLocaleDateString("en-IN") : "—"}</td>
                  <td>
                    <span className={`status-badge status-${c.status.toLowerCase()}`}>{c.status}</span>
                  </td>
                  <td className="table-actions">
                    <button
                      className="row-icon-btn"
                      onClick={() => handleQuickDownload(c)}
                      title="Download PDF"
                      disabled={actionBusyId === c._id}
                    >
                      <FaDownload />
                    </button>

                    <div className="row-menu">
                      <button
                        ref={openMenuId === c._id ? menuRef : null}
                        className="row-icon-btn row-menu-trigger"
                        onClick={() => setOpenMenuId(openMenuId === c._id ? null : c._id)}
                        title="More actions"
                        aria-haspopup="true"
                        aria-expanded={openMenuId === c._id}
                      >
                        <FaEllipsisV />
                      </button>

                      <RowMenuPortal
                        anchorRef={menuRef}
                        open={openMenuId === c._id}
                        onClose={() => setOpenMenuId(null)}
                      >
                          <button role="menuitem" onClick={() => { setPreviewCard(c); setOpenMenuId(null); }}>
                            <FaEye /> <span>View</span>
                          </button>
                          <button role="menuitem" onClick={() => { openEditModal(c); setOpenMenuId(null); }}>
                            <FaEdit /> <span>Edit</span>
                          </button>
                          <button role="menuitem" onClick={() => { setPreviewCard(c); setOpenMenuId(null); }}>
                            <FaPrint /> <span>Print</span>
                          </button>
                          <button role="menuitem" onClick={() => { setQrPreview(c); setOpenMenuId(null); }}>
                            <FaQrcode /> <span>View QR</span>
                          </button>

                          <div className="row-menu-divider" role="separator" />

                          <button
                            role="menuitem"
                            onClick={() => { handleSync(c._id); setOpenMenuId(null); }}
                            disabled={actionBusyId === c._id}
                          >
                            <FaSyncAlt /> <span>Sync from Admission</span>
                          </button>

                          <div className="row-menu-divider" role="separator" />

                          <button
                            role="menuitem"
                            className="danger"
                            onClick={() => { handleDelete(c._id); setOpenMenuId(null); }}
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
              onClick={() => fetchIdCards(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <IdCardFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => fetchIdCards(pagination.page)}
        idCard={editingCard}
      />

      <IdCardPreviewModal
        isOpen={!!previewCard}
        onClose={() => setPreviewCard(null)}
        idCard={previewCard}
        onGenerated={() => fetchIdCards(pagination.page)}
      />

      {qrPreview && (
        <div className="qr-preview-overlay" onClick={() => setQrPreview(null)}>
          <div className="qr-preview-box" onClick={(e) => e.stopPropagation()}>
            <span className="qr-preview-eyebrow">
              <FaQrcode /> ID Card QR
            </span>
            <h3>{qrPreview.idCardNumber}</h3>
            <p>{qrPreview.studentName}</p>
            {qrPreview.qrCode && <img src={qrPreview.qrCode} alt="ID Card QR Code" />}
            <button onClick={() => setQrPreview(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIdCards;
