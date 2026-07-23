// Central Role-Based Access Control (RBAC) config.
// Add new roles/modules here — every route + the frontend sidebar reads from
// this single source of truth so permissions never drift out of sync.

export const ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  RECEPTION: "reception",
  HR: "hr",
  FACULTY: "faculty",
  ACCOUNTS: "accounts",
};

export const ALL_ROLES = Object.values(ROLES);

// Every protectable module/menu in the admin panel.
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
};

// superadmin is special-cased to always have access to every module (see
// hasPermission below) so it never needs to be listed/maintained here.
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    MODULES.DASHBOARD,
    MODULES.STUDENTS,
    MODULES.CERTIFICATES,
    MODULES.FEE_RECEIPTS,
    MODULES.SEARCH,
  ],
  [ROLES.RECEPTION]: [
    MODULES.DASHBOARD,
    MODULES.STUDENTS,
    MODULES.FEE_RECEIPTS,
    MODULES.SEARCH,
  ],
  [ROLES.HR]: [
    MODULES.DASHBOARD,
    MODULES.CLIENTS,
    MODULES.INTERNSHIPS,
    MODULES.SEARCH,
  ],
  [ROLES.FACULTY]: [
    MODULES.DASHBOARD,
    MODULES.CERTIFICATES,
    MODULES.INTERNSHIPS,
    MODULES.SEARCH,
  ],
  [ROLES.ACCOUNTS]: [
    MODULES.DASHBOARD,
    MODULES.FEE_RECEIPTS,
    MODULES.SEARCH,
  ],
};

export function getPermissionsForRole(role) {
  if (role === ROLES.SUPERADMIN) return Object.values(MODULES);
  return ROLE_PERMISSIONS[role] || [];
}

export function hasPermission(role, moduleKey) {
  if (role === ROLES.SUPERADMIN) return true;
  return (ROLE_PERMISSIONS[role] || []).includes(moduleKey);
}
