import { Link } from "react-router-dom";
import "./Unauthorized.css";

// Generic "module coming soon" placeholder — reused for panels whose data
// model/generator isn't built yet (ID Cards, Course Enrollments). Styled
// with the existing Unauthorized.css so it matches the rest of the admin panel.
const AdminComingSoon = ({ icon, title, message }) => (
  <div className="unauthorized-page">
    {icon}
    <h1>{title}</h1>
    <p>{message}</p>
    <p className="unauthorized-hint">This module is coming in the next phase.</p>
    <Link to="/admin/dashboard" className="unauthorized-back-btn">
      Back to Dashboard
    </Link>
  </div>
);

export default AdminComingSoon;
