import { useState, useEffect, useCallback } from "react";
import { FaSearch, FaPlus, FaEdit, FaTrash, FaBuilding } from "react-icons/fa";
import adminApi from "../api/adminApi";
import siteConfig from "../../config/siteConfig";
import ClientFormModal from "../components/ClientFormModal";
import "./AdminClients.css";

const AdminClients = () => {
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const fetchClients = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.get("/clients", {
        params: { search, status, page, limit: 10 },
      });
      setClients(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load client records.");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = setTimeout(() => fetchClients(1), 300); // debounce search
    return () => clearTimeout(timer);
  }, [fetchClients]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this client record? This cannot be undone.")) return;
    try {
      await adminApi.delete(`/clients/${id}`);
      fetchClients(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete client record.");
    }
  };

  const openAddModal = () => {
    setEditingClient(null);
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingClient(record);
    setModalOpen(true);
  };

  return (
    <div className="admin-clients">
      <div className="admin-clients-header">
        <div>
          <h1>Clients</h1>
          <p className="admin-dashboard-sub">{pagination.total} total client records</p>
        </div>

        <button className="add-client-btn" onClick={openAddModal}>
          <FaPlus /> Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="clients-filters">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by client, company, project, technology..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option>Ongoing</option>
          <option>Completed</option>
          <option>On Hold</option>
        </select>
      </div>

      {error && <p className="admin-dashboard-error">{error}</p>}

      {/* Table */}
      <div className="clients-table-wrap">
        <table className="clients-table">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Client</th>
              <th>Company</th>
              <th>Project</th>
              <th>Technology</th>
              <th>Status</th>
              <th>Certificate</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="table-empty">Loading...</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan="8" className="table-empty">No client records found.</td></tr>
            ) : (
              clients.map((c) => (
                <tr key={c._id}>
                  <td>
                    {c.logo ? (
                      <img src={`${siteConfig.apiBaseUrl}${c.logo}`} alt={c.companyName} className="client-logo" />
                    ) : (
                      <FaBuilding className="client-logo-placeholder" />
                    )}
                  </td>
                  <td>{c.clientName}</td>
                  <td>{c.companyName}</td>
                  <td>{c.project}</td>
                  <td>{c.technology}</td>
                  <td>
                    <span className={`status-badge status-${c.status.replace(/\s+/g, "-").toLowerCase()}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>{c.certificateRef?.certificateNumber || "—"}</td>
                  <td className="table-actions">
                    <button onClick={() => openEditModal(c)} title="Edit"><FaEdit /></button>
                    <button onClick={() => handleDelete(c._id)} title="Delete" className="danger"><FaTrash /></button>
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
              onClick={() => fetchClients(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <ClientFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => fetchClients(pagination.page)}
        client={editingClient}
      />
    </div>
  );
};

export default AdminClients;
