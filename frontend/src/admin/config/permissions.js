// Mirrors backend/src/config/permissions.js module keys.
// The actual role -> module mapping lives on the server (returned as
// `admin.permissions` from /api/admin/auth/me and /login) so the frontend
// never has to duplicate or drift out of sync with the real RBAC rules.

export const MODULES = {
  DASHBOARD: "dashboard",
  STUDENTS: "students",
  CERTIFICATES: "certificates",
  INTERNSHIPS: "internships",
  CLIENTS: "clients",
  FEE_RECEIPTS: "feeReceipts",
  ID_CARDS: "idCards",
  ENROLLMENTS: "enrollments",
  CONTACTS: "contacts",
  NEWSLETTER: "newsletter",
  SETTINGS: "settings",
  ACTIVITY_LOG: "activityLog",
  SEARCH: "search",
  STAFF: "staff", // Super Admin only — not granted to any role explicitly
};

// admin: the logged-in admin object from useAdminAuth() (has .permissions)
export const can = (admin, moduleKey) => !!admin?.permissions?.includes(moduleKey);
