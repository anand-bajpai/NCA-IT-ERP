import { useState, useEffect, useCallback } from "react";
import { FaPlus, FaEdit, FaTrash, FaUserShield, FaKey, FaSearch } from "react-icons/fa";
import adminApi from "../api/adminApi";
import { useAdminAuth } from "../context/AdminAuthContext";
import Can from "../components/Can";
import { MODULES } from "../config/permissions";
import "./AdminUsers.css";

const ROLE_LABELS = {
  superadmin: "Super Admin",
  admin: "Admin",
  reception: "Reception",
  hr: "HR",
  faculty: "Faculty",
  accounts: "Accounts",
};

const ROLE_OPTIONS = Object.keys(ROLE_LABELS);
const PAGE_SIZE = 10;

const emptyForm = { name: "", email: "", password: "", role: "admin" };

const AdminUsers = () => {
  const { admin: currentAdmin } = useAdminAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetting, setResetting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.get("/users", { params: { page, limit: PAGE_SIZE, search } });
      setUsers(res.data.users);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotal(res.data.pagination?.total ?? res.data.users.length);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load staff accounts.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const openAddForm = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  };

  const openEditForm = (user) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
    setFormError("");
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editingUser) {
        await adminApi.put(`/users/${editingUser.id}`, { name: form.name, role: form.role });
      } else {
        await adminApi.post("/users", form);
      }
      setFormOpen(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || "Could not save staff account.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await adminApi.put(`/users/${user.id}`, { isActive: !user.isActive });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Could not update staff account.");
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Remove ${user.name}'s account? This cannot be undone.`)) return;
    try {
      await adminApi.delete(`/users/${user.id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete staff account.");
    }
  };

  const openResetPassword = (user) => {
    setResetTarget(user);
    setResetPassword("");
    setResetError("");
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetting(true);
    setResetError("");
    try {
      await adminApi.put(`/users/${resetTarget.id}/reset-password`, { password: resetPassword });
      setResetTarget(null);
    } catch (err) {
      setResetError(err.response?.data?.message || "Could not reset password.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="admin-users">
      <div className="admin-users-header">
        <div>
          <h1>Staff & Roles</h1>
          <p className="admin-dashboard-sub">Manage admin panel access for your team</p>
        </div>
        <Can module={MODULES.STAFF}>
          <button className="add-user-btn" onClick={openAddForm}>
            <FaPlus /> Add Staff
          </button>
        </Can>
      </div>

      <form className="users-search" onSubmit={handleSearchSubmit}>
        <FaSearch className="users-search-icon" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit">Search</button>
        {search && (
          <button
            type="button"
            className="users-search-clear"
            onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
          >
            Clear
          </button>
        )}
      </form>

      {error && <p className="admin-dashboard-error">{error}</p>}

      <div className="users-table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="table-empty">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="5" className="table-empty">No staff accounts found.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.role === "superadmin" && <FaUserShield title="Super Admin" className="superadmin-icon" />}{" "}
                    {u.name}
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`role-badge role-${u.role}`}>{ROLE_LABELS[u.role] || u.role}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-${u.isActive ? "active" : "inactive"}`}>
                      {u.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button onClick={() => openEditForm(u)} title="Change role / edit"><FaEdit /></button>
                    <button onClick={() => openResetPassword(u)} title="Reset password"><FaKey /></button>
                    {u.id !== currentAdmin?.id && (
                      <>
                        <button onClick={() => handleToggleActive(u)} title={u.isActive ? "Disable" : "Activate"}>
                          {u.isActive ? "Disable" : "Activate"}
                        </button>
                        <button onClick={() => handleDelete(u)} title="Delete" className="danger"><FaTrash /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="users-pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {page} of {totalPages} &middot; {total} staff account{total === 1 ? "" : "s"}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}

      {formOpen && (
        <div className="user-form-overlay" onClick={() => setFormOpen(false)}>
          <form className="user-form" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <h2>{editingUser ? "Edit Staff Account" : "Add Staff Account"}</h2>

            {formError && <p className="admin-dashboard-error">{formError}</p>}

            <label>
              Name
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>

            <label>
              Email
              <input
                type="email"
                required
                disabled={!!editingUser}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>

            {!editingUser && (
              <label>
                Password
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </label>
            )}

            <label>
              Role
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </label>

            <div className="user-form-actions">
              <button type="button" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</button>
              <button type="submit" className="primary" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {resetTarget && (
        <div className="user-form-overlay" onClick={() => setResetTarget(null)}>
          <form className="user-form" onClick={(e) => e.stopPropagation()} onSubmit={handleResetPassword}>
            <h2>Reset Password</h2>
            <p className="admin-dashboard-sub">Set a new password for {resetTarget.name}</p>

            {resetError && <p className="admin-dashboard-error">{resetError}</p>}

            <label>
              New Password
              <input
                type="password"
                required
                minLength={6}
                autoFocus
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
              />
            </label>

            <div className="user-form-actions">
              <button type="button" onClick={() => setResetTarget(null)} disabled={resetting}>Cancel</button>
              <button type="submit" className="primary" disabled={resetting}>
                {resetting ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
