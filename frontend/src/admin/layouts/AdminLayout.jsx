import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUserGraduate,
  FaCertificate,
  FaFileInvoiceDollar,
  FaIdCard,
  FaBookOpen,
  FaEnvelopeOpenText,
  FaCog,
  FaUsersCog,
  FaSignOutAlt,
  FaBars,
} from "react-icons/fa";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useInstituteSettings } from "../../context/InstituteSettingsContext";
import { MODULES, can } from "../config/permissions";
import "../styles/admin-shared.css";
import "../styles/form-shared.css";
import "./AdminLayout.css";

const menuItems = [
  { label: "Dashboard", icon: <FaTachometerAlt />, path: "/admin/dashboard", module: MODULES.DASHBOARD, ready: true },
  { label: "Enquiries", icon: <FaEnvelopeOpenText />, path: "/admin/enquiries", module: MODULES.CONTACTS, ready: true },
  // "Students" renamed to "Admissions" for the IT-institute admin panel —
  // same route/component/permission, label only.
  { label: "Admissions", icon: <FaUserGraduate />, path: "/admin/students", module: MODULES.STUDENTS, ready: true },
  { label: "Certificates", icon: <FaCertificate />, path: "/admin/certificates", module: MODULES.CERTIFICATES, ready: true },
  { label: "Fee Receipts", icon: <FaFileInvoiceDollar />, path: "/admin/fee-receipts", module: MODULES.FEE_RECEIPTS, ready: true },
  { label: "ID Cards", icon: <FaIdCard />, path: "/admin/id-cards", module: MODULES.ID_CARDS, ready: true },
  { label: "Course Enrollments", icon: <FaBookOpen />, path: "/admin/enrollments", module: MODULES.ENROLLMENTS, ready: true },
  { label: "Institute Settings", icon: <FaCog />, path: "/admin/settings", module: MODULES.SETTINGS, ready: true },
  // "Staff & Roles" renamed to "Admin Users" — same route/component/permission, label only.
  { label: "Admin Users", icon: <FaUsersCog />, path: "/admin/users", module: MODULES.STAFF, ready: true },
];
// Reports and Activity Logs entries were removed from the sidebar per the
// updated dashboard scope. No routes/pages existed for them (they were
// "Soon" placeholders), so nothing else needs to change.
// Note: Students, Clients, and Internship entries were removed from this
// menu per the updated sidebar scope. Their pages/routes/backend are
// untouched (not deleted) — only unlinked from navigation — in case
// they're needed again later.

const isMobileViewport = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;

const AdminLayout = () => {
  // On phones the sidebar starts closed so it never covers the page content.
  const [collapsed, setCollapsed] = useState(() => isMobileViewport());
  const { admin, logout } = useAdminAuth();
  const { logo, companyName } = useInstituteSettings();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  // On mobile, tapping a menu item should also close the drawer.
  const closeOnMobile = () => {
    if (isMobileViewport()) setCollapsed(true);
  };

  return (
    <div className={`admin-shell ${collapsed ? "collapsed" : ""}`}>

      {/* Mobile-only backdrop behind the open sidebar drawer */}
      {!collapsed && (
        <div className="admin-sidebar-backdrop" onClick={() => setCollapsed(true)} />
      )}

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <span className="brand-mark">
            {logo ? <img src={logo} alt={companyName} /> : "NCA"}
          </span>
          {!collapsed && <span className="brand-text">Admin Panel</span>}
        </div>

        <nav className="admin-menu">
          {menuItems.filter((item) => !item.module || can(admin, item.module)).map((item) =>
            item.ready ? (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeOnMobile}
                className={({ isActive }) => "admin-menu-item" + (isActive ? " active" : "")}
              >
                <span className="admin-menu-icon">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ) : (
              <div key={item.path} className="admin-menu-item disabled" title="Coming soon">
                <span className="admin-menu-icon">{item.icon}</span>
                {!collapsed && (
                  <span>
                    {item.label} <em className="soon-badge">Soon</em>
                  </span>
                )}
              </div>
            )
          )}
        </nav>

        <button className="admin-menu-item logout-btn" onClick={handleLogout}>
          <span className="admin-menu-icon"><FaSignOutAlt /></span>
          {!collapsed && <span>Logout</span>}
        </button>
      </aside>

      {/* Main content */}
      <div className="admin-main">
        <header className="admin-topbar">
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            <FaBars />
          </button>

          <div className="admin-topbar-right">
            <span className="admin-name">👤 {admin?.name}</span>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
