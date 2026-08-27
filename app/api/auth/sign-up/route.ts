import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge";

// This route only handles profile creation after client-side sign-up
export async function POST(request: NextRequest) {
  try {
    const { userId, name, email, role, studentId, faculty, yearOfStudy } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Refuse re-registration of a suspended account. Check both by id and by
    // email so a banned user can't slip back in with the same address.
    const { data: byId } = await insforgeAdmin.database
      .from("student_profiles")
      .select("role")
      .eq("id", userId)
      .limit(1);

    let bannedMatch = byId?.[0]?.role === "banned";

    if (!bannedMatch && email) {
      const { data: byEmail } = await insforgeAdmin.database
        .from("student_profiles")
        .select("role")
        .eq("email", email)
        .limit(1);
      bannedMatch = byEmail?.[0]?.role === "banned";
    }

    if (bannedMatch) {
      return NextResponse.json(
        { error: "This account has been suspended by an administrator and cannot be re-registered." },
        { status: 403 }
      );
    }

    await insforgeAdmin.database.from("student_profiles").upsert([{
      id: userId,
      name: name || email?.split("@")[0] || "Student",
      email: email || "",
      role: role || "student",
      anonymous_id: userId.slice(0, 8),
      student_id: studentId || null,
      faculty: faculty || null,
      year_of_study: yearOfStudy || null,
    }]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
