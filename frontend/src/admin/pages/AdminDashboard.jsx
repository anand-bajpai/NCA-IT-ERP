import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserGraduate,
  FaEnvelopeOpenText,
  FaCertificate,
  FaRupeeSign,
  FaFileInvoiceDollar,
  FaIdCard,
  FaPlus,
  FaBookOpen,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import adminApi from "../api/adminApi";
import "./AdminDashboard.css";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PIE_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await adminApi.get("/dashboard/stats");
        setStats(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load dashboard stats.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = stats
    ? [
        { label: "Total Admissions", value: stats.totalAdmissions, icon: <FaUserGraduate />, color: "#2563eb" },
        { label: "Total Enquiries", value: stats.totalEnquiries, icon: <FaEnvelopeOpenText />, color: "#0891b2" },
        { label: "Total Certificates", value: stats.totalCertificates, icon: <FaCertificate />, color: "#7c3aed" },
        { label: "Fee Collection", value: `₹${stats.feeCollection.toLocaleString("en-IN")}`, icon: <FaRupeeSign />, color: "#059669" },
        { label: "Pending Fees", value: `₹${stats.pendingFees.toLocaleString("en-IN")}`, icon: <FaFileInvoiceDollar />, color: "#f97316" },
        { label: "ID Cards", value: stats.idCardsGenerated, icon: <FaIdCard />, color: "#dc2626" },
      ]
    : [];

  const quickActions = [
    { label: "New Enquiry", icon: <FaPlus />, onClick: () => navigate("/admin/enquiries") },
    { label: "New Admission", icon: <FaUserGraduate />, onClick: () => navigate("/admin/students") },
    { label: "Generate Certificate", icon: <FaCertificate />, onClick: () => navigate("/admin/certificates") },
    { label: "Generate Fee Receipt", icon: <FaFileInvoiceDollar />, onClick: () => navigate("/admin/fee-receipts") },
    { label: "Generate ID Card", icon: <FaIdCard />, onClick: () => navigate("/admin/id-cards") },
    { label: "Course Enrollment", icon: <FaBookOpen />, onClick: () => navigate("/admin/enrollments") },
  ];

  const monthlyAdmissionsData = (stats?.monthlyAdmissions || []).map((m) => ({
    name: MONTH_NAMES[m._id.month - 1],
    admissions: m.count,
  }));

  const monthlyFeeData = (stats?.monthlyFeeCollection || []).map((m) => ({
    name: MONTH_NAMES[m._id.month - 1],
    collected: m.total,
  }));

  const courseData = (stats?.courseWise || []).map((c) => ({
    name: c._id || "Unspecified",
    value: c.count,
  }));

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p className="admin-dashboard-error">{error}</p>;

  return (
    <div className="admin-dashboard">
      <h1>Dashboard</h1>
      <p className="admin-dashboard-sub">Welcome back — here's what's happening today.</p>

      {/* Stat cards */}
      <div className="stat-cards-grid">
        {cards.map((card) => (
          <div className="stat-card" key={card.label}>
            <div className="stat-icon" style={{ background: card.color }}>
              {card.icon}
            </div>
            <div>
              <p className="stat-value">{card.value}</p>
              <p className="stat-label">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="section-heading">Quick Actions</h2>
      <div className="quick-actions-grid">
        {quickActions.map((action) => (
          <button className="quick-action-btn" key={action.label} onClick={action.onClick}>
            <span className="quick-action-icon">{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Charts */}
      <h2 className="section-heading">Overview</h2>
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Monthly Admissions</h3>
          {monthlyAdmissionsData.length === 0 ? (
            <p className="chart-empty">No admissions data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyAdmissionsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="admissions" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Monthly Fee Collection</h3>
          {monthlyFeeData.length === 0 ? (
            <p className="chart-empty">No fee collection data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyFeeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
                <Bar dataKey="collected" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Course-wise Enrollments</h3>
          {courseData.length === 0 ? (
            <p className="chart-empty">No enrollments yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={courseData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {courseData.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
