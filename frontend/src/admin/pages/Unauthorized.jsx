import { Link } from "react-router-dom";
import { FaLock } from "react-icons/fa";
import { useAdminAuth } from "../context/AdminAuthContext";
import "./Unauthorized.css";

const Unauthorized = () => {
  const { admin } = useAdminAuth();

  return (
    <div className="unauthorized-page">
      <FaLock className="unauthorized-icon" />
      <h1>Access Denied</h1>
      <p>
        {admin?.name ? `Hi ${admin.name}, y` : "Y"}our account role
        {admin?.role ? ` (${admin.role})` : ""} doesn't have permission to view this page.
      </p>
      <p className="unauthorized-hint">If you think this is a mistake, contact your Super Admin.</p>
      <Link to="/admin/dashboard" className="unauthorized-back-btn">
        Back to Dashboard
      </Link>
    </div>
  );
};

export default Unauthorized;
