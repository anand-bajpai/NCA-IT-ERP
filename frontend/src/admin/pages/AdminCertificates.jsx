import { useState, useEffect, useCallback, useRef } from "react";
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaDownload,
  FaEye,
  FaSyncAlt,
  FaFileAlt,
  FaEnvelope,
  FaHistory,
  FaEllipsisV,
  FaPrint,
} from "react-icons/fa";
import adminApi from "../api/adminApi";
import CertificateFormModal from "../components/CertificateFormModal";
import CertificateViewModal from "../components/CertificateViewModal";
import CertificatePreviewModal from "../components/CertificatePreviewModal";
import CertificateHistoryModal from "../components/CertificateHistoryModal";
import RowMenuPortal from "../components/RowMenuPortal";
import "./AdminCertificates.css";

const CERTIFICATE_TYPES = [
  "Student Course Completion",
  "Internship Completion",
  "Client Project Completion",
  "Certificate of Appreciation",
  "Certificate of Excellence",
];

const AdminCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [certificateType, setCertificateType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState(null);
  const [viewCertificate, setViewCertificate] = useState(null);
  const [previewCertificate, setPreviewCertificate] = useState(null);
  const [historyCertificate, setHistoryCertificate] = useState(null);
  const [actionBusyId, setActionBusyId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  const fetchCertificates = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.get("/certificates", {
        params: { search, status, certificateType, page, limit: 10 },
      });
      setCertificates(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load certificates.");
    } finally {
      setLoading(false);
    }
  }, [search, status, certificateType]);

  useEffect(() => {
    const timer = setTimeout(() => fetchCertificates(1), 300); // debounce search
    return () => clearTimeout(timer);
  }, [fetchCertificates]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this certificate? This cannot be undone.")) return;
    try {
      await adminApi.delete(`/certificates/${id}`);
      fetchCertificates(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete certificate.");
    }
  };

  const handleDownload = async (id, certNumber) => {
    setActionBusyId(id);
    try {
      const res = await adminApi.get(`/certificates/${id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${certNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || "Could not download the certificate PDF.");
    } finally {
      setActionBusyId(null);
    }
  };

  const handleReissue = async (id) => {
    if (!window.confirm("Reissue this certificate? The old certificate number will stop verifying and a new one will be issued.")) return;
    setActionBusyId(id);
    try {
      const res = await adminApi.post(`/certificates/${id}/reissue`);
      alert(`Reissued as ${res.data.data.certificateNumber}.`);
      fetchCertificates(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || "Could not reissue certificate.");
    } finally {
      setActionBusyId(null);
    }
  };

  // Send / resend the certificate email (secure verification link, no PDF attached)
  const handleSendEmail = async (cert) => {
    let email = cert.email || "";
    if (!email) {
      email = window.prompt("No email saved on this certificate. Enter recipient email:") || "";
      if (!email.trim()) return;
    } else if (!window.confirm(`Send certificate email to ${email}?`)) {
      return;
    }
    setActionBusyId(cert._id);
    try {
      const res = await adminApi.post(`/certificates/${cert._id}/send-email`, { email: email.trim() });
      alert(res.data.message);
      fetchCertificates(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || "Could not send certificate email.");
    } finally {
      setActionBusyId(null);
    }
  };

  const openAddModal = () => {
    setEditingCertificate(null);
    setModalOpen(true);
  };

  const openEditModal = (cert) => {
    setEditingCertificate(cert);
    setModalOpen(true);
  };

  // Presentational only — used for the row avatar initials.
  const getInitials = (name) =>
    (name || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?";

  return (
    <div className="admin-certificates">
      <div className="admin-certificates-header">
        <div>
          <h1>Certificates</h1>
          <p className="admin-dashboard-sub">{pagination.total} total certificates</p>
        </div>

        <button className="add-certificate-btn" onClick={openAddModal}>
          <FaPlus /> Issue Certificate
        </button>
      </div>

      {/* Filters */}
      <div className="certificates-filters">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by certificate no., verification ID, student, mobile, course, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option>Valid</option>
          <option>Expired</option>
          <option>Revoked</option>
          <option>Reissued</option>
        </select>

        <select value={certificateType} onChange={(e) => setCertificateType(e.target.value)}>
          <option value="">All Types</option>
          {CERTIFICATE_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {error && <p className="admin-dashboard-error">{error}</p>}

      {/* Table */}
      <div className="certificates-table-wrap">
        <table className="certificates-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Certificate No.</th>
              <th>Course</th>
              <th>Joining Date</th>
              <th>Type</th>
              <th>Issue Date</th>
              <th>Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="table-empty">
                <span className="table-empty-spinner" aria-hidden="true" />
                Loading certificates…
              </td></tr>
            ) : certificates.length === 0 ? (
              <tr><td colSpan="8" className="table-empty">
                <FaFileAlt className="table-empty-icon" aria-hidden="true" />
                No certificates found.
              </td></tr>
            ) : (
              certificates.map((c) => (
                <tr key={c._id}>
                  <td>
                    <div className="student-cell">
                      <span className="student-avatar" aria-hidden="true">{getInitials(c.studentName)}</span>
                      <div className="student-cell-text">
                        <span className="student-name">{c.studentName}</span>
                        {c.mobile && <span className="student-sub">{c.mobile}</span>}
                      </div>
                    </div>
                  </td>
                  <td><span className="cert-number">{c.certificateNumber}</span></td>
                  <td>{c.course}</td>
                  <td>{c.joiningDate ? new Date(c.joiningDate).toLocaleDateString("en-IN") : "—"}</td>
                  <td><span className="type-pill">{c.certificateType}</span></td>
                  <td>{c.issueDate ? new Date(c.issueDate).toLocaleDateString("en-IN") : "—"}</td>
                  <td>
                    <span className={`status-badge status-${c.status.toLowerCase()}`}>{c.status}</span>
                  </td>
                  <td className="table-actions">
                    <button
                      className="row-icon-btn"
                      onClick={() => handleDownload(c._id, c.certificateNumber)}
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
                          <button role="menuitem" onClick={() => { setViewCertificate(c); setOpenMenuId(null); }}>
                            <FaEye /> <span>View</span>
                          </button>
                          <button role="menuitem" onClick={() => { openEditModal(c); setOpenMenuId(null); }}>
                            <FaEdit /> <span>Edit</span>
                          </button>
                          <button role="menuitem" onClick={() => { setPreviewCertificate(c); setOpenMenuId(null); }}>
                            <FaPrint /> <span>Print</span>
                          </button>
                          <button
                            role="menuitem"
                            onClick={() => { handleSendEmail(c); setOpenMenuId(null); }}
                            disabled={actionBusyId === c._id || c.status === "Revoked"}
                          >
                            <FaEnvelope /> <span>{c.emailSentCount ? "Resend Email" : "Email"}</span>
                          </button>

                          <div className="row-menu-divider" role="separator" />

                          <button role="menuitem" onClick={() => { setHistoryCertificate(c); setOpenMenuId(null); }}>
                            <FaHistory /> <span>History</span>
                          </button>
                          <button
                            role="menuitem"
                            onClick={() => { handleReissue(c._id); setOpenMenuId(null); }}
                            disabled={actionBusyId === c._id || c.status === "Reissued"}
                          >
                            <FaSyncAlt /> <span>Reissue</span>
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
              onClick={() => fetchCertificates(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <CertificateFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => fetchCertificates(pagination.page)}
        certificate={editingCertificate}
      />

      <CertificateViewModal
        isOpen={!!viewCertificate}
        onClose={() => setViewCertificate(null)}
        certificate={viewCertificate}
      />

      <CertificatePreviewModal
        isOpen={!!previewCertificate}
        onClose={() => setPreviewCertificate(null)}
        certificate={previewCertificate}
        onGenerated={() => fetchCertificates(pagination.page)}
      />

      <CertificateHistoryModal
        isOpen={!!historyCertificate}
        onClose={() => setHistoryCertificate(null)}
        certificate={historyCertificate}
      />

    </div>
  );
};

export default AdminCertificates;
