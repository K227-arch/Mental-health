import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge";

// Ban management for rejected counsellors (and any user).
// Bans live in the dedicated `banned_users` table (keyed by user_id, with the
// email recorded too) so a suspended user can neither sign in nor re-register.
// On ban we also strip their counsellor/admin access and flag their
// student_profiles.role = "banned" as a fast-path signal for /api/auth/me.

// GET — list all banned users (for the admin UI)
export async function GET() {
  try {
    const { data, error } = await insforgeAdmin.database
      .from("banned_users")
      .select("user_id, email, name, reason, created_at")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    // Normalize to `id` for the UI (it keys rows on `id`).
    const banned = (data || []).map((b: any) => ({ id: b.user_id, ...b }));
    return NextResponse.json({ banned });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — ban (reject) a user by id
export async function POST(request: NextRequest) {
  try {
    const { userId, reason } = await request.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    // Grab their name/email so the ban record and future email checks work.
    const { data: existing } = await insforgeAdmin.database
      .from("student_profiles")
      .select("id, name, email")
      .eq("id", userId)
      .limit(1);
    const profile = existing?.[0];

    // Record the ban (upsert so re-banning is idempotent).
    await insforgeAdmin.database.from("banned_users").upsert([{
      user_id: userId,
      email: profile?.email || "",
      name: profile?.name || "",
      reason: reason || "Rejected by administrator",
    }]);

    // Flag the profile and strip elevated access.
    if (profile) {
      await insforgeAdmin.database
        .from("student_profiles")
        .update({ role: "banned" })
        .eq("id", userId);
    }
    await insforgeAdmin.database.from("counsellor_profiles").delete().eq("id", userId);
    await insforgeAdmin.database.from("admin_profiles").delete().eq("id", userId);

    return NextResponse.json({ banned: { userId } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — unban a user (remove ban record, restore to student)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    await insforgeAdmin.database.from("banned_users").delete().eq("user_id", userId);

    await insforgeAdmin.database
      .from("student_profiles")
      .update({ role: "student" })
      .eq("id", userId);

    return NextResponse.json({ unbanned: { userId } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
