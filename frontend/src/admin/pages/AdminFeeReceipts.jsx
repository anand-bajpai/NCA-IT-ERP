import { useState, useEffect, useCallback, useRef } from "react";
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaFilePdf,
  FaEnvelope,
  FaEye,
  FaHistory,
  FaRupeeSign,
  FaFileInvoiceDollar,
  FaReceipt,
  FaExclamationCircle,
  FaFilter,
  FaTimesCircle,
  FaEllipsisV,
} from "react-icons/fa";
import adminApi from "../api/adminApi";
import { coursesData } from "../../data/courses";
import FeeReceiptFormModal from "../components/FeeReceiptFormModal";
import ReceiptPreview from "../components/ReceiptPreview";
import PaymentHistoryModal from "../components/PaymentHistoryModal";
import RowMenuPortal from "../components/RowMenuPortal";
import "./AdminFeeReceipts.css";

const PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Card", "Cheque", "Online"];

const emptyFilters = { course: "", paymentMode: "", dateFrom: "", dateTo: "" };

const AdminFeeReceipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  // "all" | "pending" — the Pending Fees tab is just the same list pre-filtered
  const [tab, setTab] = useState("all");
  const [filters, setFilters] = useState(emptyFilters);
  const [showFilters, setShowFilters] = useState(false);

  const [summary, setSummary] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [previewReceipt, setPreviewReceipt] = useState(null);
  const [historyStudent, setHistoryStudent] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  const fetchReceipts = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.get("/fee-receipts", {
        params: {
          search,
          page,
          limit: 10,
          status: tab === "pending" ? "pending" : undefined,
          course: filters.course || undefined,
          paymentMode: filters.paymentMode || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        },
      });
      setReceipts(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load fee receipts.");
    } finally {
      setLoading(false);
    }
  }, [search, tab, filters]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await adminApi.get("/fee-receipts/summary");
      setSummary(res.data.data);
    } catch {
      // Stat cards are a nice-to-have; fail silently so the table still works.
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchReceipts(1), 300); // debounce search
    return () => clearTimeout(timer);
  }, [fetchReceipts]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Refresh the stat cards whenever the table refreshes for a reason other
  // than typing (create/update/delete), so totals stay in sync.
  const refreshAll = (page = pagination.page) => {
    fetchReceipts(page);
    fetchSummary();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this fee receipt? This cannot be undone.")) return;
    try {
      await adminApi.delete(`/fee-receipts/${id}`);
      refreshAll(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete fee receipt.");
    }
  };

  const handleDownload = async (receipt) => {
    setBusyId(receipt._id);
    try {
      const res = await adminApi.get(`/fee-receipts/${receipt._id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${receipt.receiptNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Could not download PDF.");
    } finally {
      setBusyId(null);
    }
  };

  const handleEmail = async (receipt) => {
    if (!receipt.studentEmail) {
      alert("No email saved for this student. Edit the receipt to add one first.");
      return;
    }
    if (!window.confirm(`Send this receipt to ${receipt.studentEmail}?`)) return;
    setBusyId(receipt._id);
    try {
      await adminApi.post(`/fee-receipts/${receipt._id}/email`);
      alert("Receipt emailed successfully.");
      fetchReceipts(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || "Could not send email.");
    } finally {
      setBusyId(null);
    }
  };

  const openAddModal = () => {
    setEditingReceipt(null);
    setModalOpen(true);
  };

  const openEditModal = (receipt) => {
    setEditingReceipt(receipt);
    setModalOpen(true);
  };

  const viewHistory = (receipt) => {
    if (!receipt.student) {
      alert("This receipt isn't linked to a saved student record, so history can't be grouped.");
      return;
    }
    setHistoryStudent({ id: receipt.student, name: receipt.studentName });
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const clearFilters = () => setFilters(emptyFilters);

  const inr = (n) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;

  const statCards = summary
    ? [
        { label: "Total Receipts", value: summary.totalReceipts, icon: <FaReceipt />, color: "#2563eb" },
        { label: "Total Collected", value: inr(summary.totalCollected), icon: <FaRupeeSign />, color: "#059669" },
        { label: "Total Pending", value: inr(summary.totalPending), icon: <FaFileInvoiceDollar />, color: "#f97316" },
        { label: "Receipts With Dues", value: summary.pendingCount, icon: <FaExclamationCircle />, color: "#dc2626" },
      ]
    : [];

  return (
    <div className="admin-receipts">
      <div className="admin-receipts-header">
        <div>
          <h1>Fee Receipts</h1>
          <p className="admin-dashboard-sub">{pagination.total} total receipts</p>
        </div>

        <button className="add-receipt-btn" onClick={openAddModal}>
          <FaPlus /> New Receipt
        </button>
      </div>

      {statCards.length > 0 && (
        <div className="receipts-stat-cards">
          {statCards.map((c) => (
            <div className="receipt-stat-card" key={c.label}>
              <span className="receipt-stat-icon" style={{ background: `${c.color}1a`, color: c.color }}>
                {c.icon}
              </span>
              <div>
                <p className="receipt-stat-value">{c.value}</p>
                <p className="receipt-stat-label">{c.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="receipts-tabs">
        <button className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>
          All Receipts
        </button>
        <button className={tab === "pending" ? "active" : ""} onClick={() => setTab("pending")}>
          Pending Fees {summary?.pendingCount ? `(${summary.pendingCount})` : ""}
        </button>
      </div>

      <div className="receipts-filters">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by receipt no, student name, mobile, admission no, transaction id..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          className={`filter-toggle-btn ${activeFilterCount ? "has-active" : ""}`}
          onClick={() => setShowFilters((v) => !v)}
        >
          <FaFilter /> Filters {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
        </button>
      </div>

      {showFilters && (
        <div className="receipts-filters-panel">
          <select value={filters.course} onChange={(e) => setFilters({ ...filters, course: e.target.value })}>
            <option value="">All Courses</option>
            {coursesData.map((c) => (
              <option key={c.id} value={c.title}>{c.title}</option>
            ))}
          </select>

          <select value={filters.paymentMode} onChange={(e) => setFilters({ ...filters, paymentMode: e.target.value })}>
            <option value="">All Payment Modes</option>
            {PAYMENT_MODES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <label className="filter-date-field">
            From
            <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
          </label>

          <label className="filter-date-field">
            To
            <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
          </label>

          {activeFilterCount > 0 && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              <FaTimesCircle /> Clear
            </button>
          )}
        </div>
      )}

      {error && <p className="admin-dashboard-error">{error}</p>}

      <div className="receipts-table-wrap">
        <table className="receipts-table">
          <thead>
            <tr>
              <th>Receipt No</th>
              <th>Student</th>
              <th>Course</th>
              <th>Grand Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Date</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="table-empty">Loading...</td></tr>
            ) : receipts.length === 0 ? (
              <tr><td colSpan="9" className="table-empty">No fee receipts found.</td></tr>
            ) : (
              receipts.map((r) => (
                <tr key={r._id}>
                  <td className="mono">{r.receiptNumber}</td>
                  <td>{r.studentName}</td>
                  <td>{r.course}</td>
                  <td>Rs. {Number(r.grandTotal).toLocaleString("en-IN")}</td>
                  <td>Rs. {Number(r.amountPaid).toLocaleString("en-IN")}</td>
                  <td>
                    <span className={`balance-badge ${r.balanceDue > 0 ? "due" : "clear"}`}>
                      Rs. {Number(r.balanceDue).toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td>{new Date(r.paymentDate).toLocaleDateString("en-IN")}</td>
                  <td>
                    {r.emailSent ? <span className="email-sent-badge">Sent</span> : <span className="email-pending-badge">—</span>}
                  </td>
                  <td className="table-actions">
                    <button
                      className="row-icon-btn"
                      onClick={() => handleDownload(r)}
                      title="Download PDF"
                      disabled={busyId === r._id}
                    >
                      <FaFilePdf />
                    </button>

                    <div className="row-menu">
                      <button
                        ref={openMenuId === r._id ? menuRef : null}
                        className="row-icon-btn row-menu-trigger"
                        onClick={() => setOpenMenuId(openMenuId === r._id ? null : r._id)}
                        title="More actions"
                        aria-haspopup="true"
                        aria-expanded={openMenuId === r._id}
                      >
                        <FaEllipsisV />
                      </button>

                      <RowMenuPortal
                        anchorRef={menuRef}
                        open={openMenuId === r._id}
                        onClose={() => setOpenMenuId(null)}
                      >
                          <button role="menuitem" onClick={() => { setPreviewReceipt(r); setOpenMenuId(null); }}>
                            <FaEye /> <span>View / Print</span>
                          </button>
                          <button role="menuitem" onClick={() => { openEditModal(r); setOpenMenuId(null); }}>
                            <FaEdit /> <span>Edit</span>
                          </button>
                          <button
                            role="menuitem"
                            onClick={() => { handleEmail(r); setOpenMenuId(null); }}
                            disabled={busyId === r._id}
                          >
                            <FaEnvelope /> <span>{r.emailSent ? "Resend Email" : "Email"}</span>
                          </button>
                          <button role="menuitem" onClick={() => { viewHistory(r); setOpenMenuId(null); }}>
                            <FaHistory /> <span>Payment History</span>
                          </button>

                          <div className="row-menu-divider" role="separator" />

                          <button
                            role="menuitem"
                            className="danger"
                            onClick={() => { handleDelete(r._id); setOpenMenuId(null); }}
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

      {pagination.totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={p === pagination.page ? "active" : ""}
              onClick={() => fetchReceipts(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <FeeReceiptFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => refreshAll(pagination.page)}
        receipt={editingReceipt}
      />

      <ReceiptPreview receipt={previewReceipt} onClose={() => setPreviewReceipt(null)} />

      <PaymentHistoryModal
        isOpen={!!historyStudent}
        onClose={() => setHistoryStudent(null)}
        student={historyStudent}
        onPreview={setPreviewReceipt}
        onDownload={handleDownload}
        onEmail={handleEmail}
        busyId={busyId}
      />
    </div>
  );
};

export default AdminFeeReceipts;
