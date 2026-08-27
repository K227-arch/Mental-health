import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge";

// Ban management for rejected counsellors (and any user).
// A ban is represented by setting student_profiles.role = "banned".
// The row is KEPT (not deleted) so the ban survives the user re-authenticating
// with the same account. The user is also removed from counsellor_profiles so
// they immediately lose counsellor access.

// GET — list all banned users (for the admin UI)
export async function GET() {
  try {
    const { data, error } = await insforgeAdmin.database
      .from("student_profiles")
      .select("id, name, email, role, created_at")
      .eq("role", "banned")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ banned: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — ban (reject) a user by id
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    // Flip their role to "banned" in student_profiles (create the row if it's
    // somehow missing so the flag always exists).
    const { data: existing } = await insforgeAdmin.database
      .from("student_profiles")
      .select("id, name, email")
      .eq("id", userId)
      .limit(1);

    if (existing && existing.length > 0) {
      await insforgeAdmin.database
        .from("student_profiles")
        .update({ role: "banned" })
        .eq("id", userId);
    } else {
      await insforgeAdmin.database.from("student_profiles").insert([{
        id: userId,
        name: "",
        email: "",
        role: "banned",
        anonymous_id: userId.slice(0, 8),
      }]);
    }

    // Remove counsellor + admin access.
    await insforgeAdmin.database.from("counsellor_profiles").delete().eq("id", userId);
    await insforgeAdmin.database.from("admin_profiles").delete().eq("id", userId);

    return NextResponse.json({ banned: { userId } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — unban a user (restore to student)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    await insforgeAdmin.database
      .from("student_profiles")
      .update({ role: "student" })
      .eq("id", userId);

    return NextResponse.json({ unbanned: { userId } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
