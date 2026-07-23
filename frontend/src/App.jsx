import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";
import { InstituteSettingsProvider } from "./context/InstituteSettingsContext";

import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Courses from "./pages/Courses";
import CourseDetailPage from "./pages/CourseDetailPage";
import Portfolio from "./pages/Portfolio";
import Internship from "./pages/Internship";
import CertificateVerificationPage from "./pages/CertificateVerification";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

// --- Admin Panel ---
import { AdminAuthProvider } from "./admin/context/AdminAuthContext";
import ProtectedRoute from "./admin/components/ProtectedRoute";
import AdminLayout from "./admin/layouts/AdminLayout";
import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminStudents from "./admin/pages/AdminStudents";
import AdminCertificates from "./admin/pages/AdminCertificates";
import AdminInternships from "./admin/pages/AdminInternships";
import AdminClients from "./admin/pages/AdminClients";
import AdminFeeReceipts from "./admin/pages/AdminFeeReceipts";
import AdminEnquiries from "./admin/pages/AdminEnquiries";
import AdminIdCards from "./admin/pages/AdminIdCards";
import AdminEnrollments from "./admin/pages/AdminEnrollments";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminInstituteSettings from "./admin/pages/AdminInstituteSettings";
import Unauthorized from "./admin/pages/Unauthorized";
import { MODULES } from "./admin/config/permissions";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AdminAuthProvider>
        <InstituteSettingsProvider>
        <Routes>

          {/* Public website — unchanged design, routing, layout */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="services" element={<Services />} />
            <Route path="courses" element={<Courses />} />
            <Route path="courses/:slug" element={<CourseDetailPage />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="internship" element={<Internship />} />
            <Route path="certificate-verification" element={<CertificateVerificationPage />} />
            <Route path="certificate-verification/:verificationId" element={<CertificateVerificationPage />} />
            <Route path="contact" element={<Contact />} />
          </Route>

          {/* Admin Panel — separate layout, no public navbar/footer */}
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="unauthorized" element={<Unauthorized />} />
            <Route
              path="students"
              element={<ProtectedRoute module={MODULES.STUDENTS}><AdminStudents /></ProtectedRoute>}
            />
            <Route
              path="certificates"
              element={<ProtectedRoute module={MODULES.CERTIFICATES}><AdminCertificates /></ProtectedRoute>}
            />
            <Route
              path="internships"
              element={<ProtectedRoute module={MODULES.INTERNSHIPS}><AdminInternships /></ProtectedRoute>}
            />
            <Route
              path="clients"
              element={<ProtectedRoute module={MODULES.CLIENTS}><AdminClients /></ProtectedRoute>}
            />
            <Route
              path="fee-receipts"
              element={<ProtectedRoute module={MODULES.FEE_RECEIPTS}><AdminFeeReceipts /></ProtectedRoute>}
            />
            <Route
              path="enquiries"
              element={<ProtectedRoute module={MODULES.CONTACTS}><AdminEnquiries /></ProtectedRoute>}
            />
            <Route
              path="id-cards"
              element={
                <ProtectedRoute module={MODULES.ID_CARDS}>
                  <AdminIdCards />
                </ProtectedRoute>
              }
            />
            <Route
              path="enrollments"
              element={
                <ProtectedRoute module={MODULES.ENROLLMENTS}>
                  <AdminEnrollments />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={<ProtectedRoute module={MODULES.STAFF}><AdminUsers /></ProtectedRoute>}
            />
            <Route
              path="settings"
              element={<ProtectedRoute module={MODULES.SETTINGS}><AdminInstituteSettings /></ProtectedRoute>}
            />
          </Route>

          <Route path="*" element={<NotFound />} />

        </Routes>
        </InstituteSettingsProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;
