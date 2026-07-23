import { useAdminAuth } from "../context/AdminAuthContext";
import { can } from "../config/permissions";

// usePermission("students") -> true/false for the logged-in admin.
// Use this inside components to conditionally render buttons/actions:
//   const canManageStudents = usePermission(MODULES.STUDENTS);
//   {canManageStudents && <button>Delete</button>}
export function usePermission(moduleKey) {
  const { admin } = useAdminAuth();
  return can(admin, moduleKey);
}

export default usePermission;
