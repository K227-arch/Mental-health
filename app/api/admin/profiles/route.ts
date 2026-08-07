import { NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge";

// Get all profiles across all three tables
export async function GET() {
  try {
    // Fetch from all three tables in parallel
    const [studentsRes, counsellorsRes, adminsRes] = await Promise.all([
      insforgeAdmin.database
        .from("student_profiles")
        .select("id, name, email, role, created_at")
        .order("created_at", { ascending: false }),
      insforgeAdmin.database
        .from("counsellor_profiles")
        .select("id, name, email, role, created_at")
        .order("created_at", { ascending: false }),
      insforgeAdmin.database
        .from("admin_profiles")
        .select("id, name, email, role, created_at")
        .order("created_at", { ascending: false }),
    ]);

    const students = (studentsRes.data || []).map((p: any) => ({ ...p, role: p.role || "student" }));
    const counsellors = (counsellorsRes.data || []).map((p: any) => ({ ...p, role: "counsellor" }));
    const admins = (adminsRes.data || []).map((p: any) => ({ ...p, role: "administrator" }));

    // Merge: counsellors and admins override any student_profiles entry with the same id
    const profileMap = new Map<string, any>();
    students.forEach((p: any) => profileMap.set(p.id, p));
    counsellors.forEach((p: any) => profileMap.set(p.id, p)); // override
    admins.forEach((p: any) => profileMap.set(p.id, p));       // override

    const profiles = Array.from(profileMap.values());

    return NextResponse.json({ profiles, count: profiles.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Update a user's role — moves them to the correct table
export async function PATCH(request: Request) {
  try {
    const { userId, role } = await request.json();
    if (!userId || !role) return NextResponse.json({ error: "userId and role required" }, { status: 400 });

    // Always update student_profiles role column for backwards compatibility
    await insforgeAdmin.database
      .from("student_profiles")
      .update({ role })
      .eq("id", userId);

    if (role === "counsellor") {
      // Get user info from student_profiles to copy over
      const { data: existing } = await insforgeAdmin.database
        .from("student_profiles")
        .select("id, name, email, faculty")
        .eq("id", userId)
        .limit(1);
      const user = existing?.[0];
      if (user) {
        await insforgeAdmin.database.from("counsellor_profiles").upsert([{
          id: user.id,
          name: user.name || "",
          email: user.email || "",
          role: "counsellor",
          faculty: user.faculty || null,
          anonymous_id: user.id.slice(0, 8),
        }]);
      }
    } else if (role === "administrator") {
      const { data: existing } = await insforgeAdmin.database
        .from("student_profiles")
        .select("id, name, email")
        .eq("id", userId)
        .limit(1);
      const user = existing?.[0];
      if (user) {
        await insforgeAdmin.database.from("admin_profiles").upsert([{
          id: user.id,
          name: user.name || "",
          email: user.email || "",
          role: "administrator",
          anonymous_id: user.id.slice(0, 8),
        }]);
      }
    }

    return NextResponse.json({ updated: { userId, role } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
