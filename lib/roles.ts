import { insforgeAdmin } from "@/lib/insforge";

// The single super-admin email that is exempt from all role-separation rules.
export const ADMIN_EMAIL = "keithtwesigye74@gmail.com";

export type PortalRole = "student" | "counsellor";

// Looks up which role table(s) an email already belongs to.
async function existingRolesForEmail(email: string): Promise<Set<string>> {
  const roles = new Set<string>();
  try {
    const [students, counsellors, admins] = await Promise.all([
      insforgeAdmin.database.from("student_profiles").select("id, role").eq("email", email).limit(1),
      insforgeAdmin.database.from("counsellor_profiles").select("id").eq("email", email).limit(1),
      insforgeAdmin.database.from("admin_profiles").select("id").eq("email", email).limit(1),
    ]);

    // A student_profiles row with role "banned" is not a valid student role here.
    const s = students.data?.[0];
    if (s && s.role !== "banned") roles.add("student");
    if (counsellors.data && counsellors.data.length > 0) roles.add("counsellor");
    if (admins.data && admins.data.length > 0) roles.add("administrator");
  } catch {
    // On lookup failure, return whatever we have (fail open — other guards remain).
  }
  return roles;
}

/**
 * Determines whether using `email` for the `requestedRole` portal conflicts with
 * an existing account of a different role.
 *
 * Rule: an email registered as a student cannot be used as a counsellor, and an
 * email registered as a counsellor cannot be used as a student. The designated
 * admin email is always allowed everywhere.
 *
 * Returns a conflict message string, or null if there is no conflict.
 */
export async function checkRoleConflict(
  email: string | null | undefined,
  requestedRole: PortalRole
): Promise<string | null> {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  if (normalized === ADMIN_EMAIL) return null; // admin bypasses everything

  const roles = await existingRolesForEmail(email);

  // Admins can go anywhere.
  if (roles.has("administrator")) return null;

  if (requestedRole === "counsellor" && roles.has("student")) {
    return "This email is already registered as a student and cannot be used for a counsellor account. Please use the Student Portal, or contact an administrator.";
  }

  if (requestedRole === "student" && roles.has("counsellor")) {
    return "This email is registered as a counsellor and cannot be used as a student. Please use the Counsellor Portal.";
  }

  return null;
}
