import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { can } from "../config/permissions";

// Pass `module` (see admin/config/permissions.js MODULES) to also enforce
// RBAC on this specific page — e.g. <ProtectedRoute module={MODULES.STUDENTS}>
const ProtectedRoute = ({ children, module }) => {
  const { isAuthenticated, loading, admin } = useAdminAuth();

  if (loading) {
    return <div className="admin-route-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (module && !can(admin, module)) {
    return <Navigate to="/admin/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
