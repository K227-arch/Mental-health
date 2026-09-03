import { insforgeAdmin } from "@/lib/insforge";

// Super-admin emails — exempt from all role-separation rules and can access
// any portal. Add new admins here (code) AND in the admin_profiles table (DB).
export const ADMIN_EMAILS = new Set([
  "keithtwesigye74@gmail.com",
  "ftukamushaba90@gmail.com",
  "forkietuka@gmail.com",
]);

// Keep a single export for callers that compare one email (used throughout).
export const ADMIN_EMAIL = "keithtwesigye74@gmail.com";

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.trim().toLowerCase());
}

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
 * Returns true if the email already has a real, registered account —
 * a counsellor/admin profile, or a student profile that has actually been
 * set up (has student_id / faculty / consent, i.e. went through sign-up).
 *
 * A bare student_profiles row auto-created by /api/auth/me (id only, no
 * student details) does NOT count as a registered account, so a first-time
 * Google user is correctly detected as new.
 */
export async function hasRegisteredAccount(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  // Admin emails are always treated as registered.
  if (isAdminEmail(email)) return true;
  try {
    const [students, counsellors, admins] = await Promise.all([
      insforgeAdmin.database.from("student_profiles").select("id, role").eq("email", email).limit(1),
      insforgeAdmin.database.from("counsellor_profiles").select("id").eq("email", email).limit(1),
      insforgeAdmin.database.from("admin_profiles").select("id").eq("email", email).limit(1),
    ]);

    if (counsellors.data && counsellors.data.length > 0) return true;
    if (admins.data && admins.data.length > 0) return true;

    // Any non-banned student row means this email has an account already.
    // A brand-new Google user has NO row by email when the OAuth callback runs
    // (the /api/auth/me auto-create only happens later, once they load a page).
    const s: any = students.data?.[0];
    if (s && s.role !== "banned") return true;
  } catch {
    // On lookup failure, treat as registered to avoid locking out real users.
    return true;
  }
  return false;
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
  if (isAdminEmail(email)) return null; // admin bypasses everything

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
