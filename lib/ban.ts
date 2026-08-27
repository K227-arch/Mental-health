import { insforgeAdmin } from "@/lib/insforge";

// Returns true if the given user (by id or email) is currently banned.
// Checks the dedicated banned_users table first, then falls back to the
// student_profiles.role === "banned" flag.
export async function isBanned(userId?: string | null, email?: string | null): Promise<boolean> {
  try {
    if (userId) {
      const { data } = await insforgeAdmin.database
        .from("banned_users")
        .select("user_id")
        .eq("user_id", userId)
        .limit(1);
      if (data && data.length > 0) return true;
    }

    if (email) {
      const { data } = await insforgeAdmin.database
        .from("banned_users")
        .select("user_id")
        .eq("email", email)
        .limit(1);
      if (data && data.length > 0) return true;
    }

    // Fast-path flag as a backstop.
    if (userId) {
      const { data } = await insforgeAdmin.database
        .from("student_profiles")
        .select("role")
        .eq("id", userId)
        .limit(1);
      if (data?.[0]?.role === "banned") return true;
    }
  } catch {
    // On lookup failure, do not lock people out — fail open here; the other
    // guards (and the admin UI) still cover the common case.
  }
  return false;
}
