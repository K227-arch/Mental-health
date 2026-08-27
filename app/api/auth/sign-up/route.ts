import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge";
import { isBanned } from "@/lib/ban";
import { checkRoleConflict } from "@/lib/roles";

// This route only handles profile creation after client-side sign-up
export async function POST(request: NextRequest) {
  try {
    const { userId, name, email, role, studentId, faculty, yearOfStudy, consent } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Refuse re-registration of a suspended account (checked by id and email).
    if (await isBanned(userId, email)) {
      return NextResponse.json(
        { error: "This account has been suspended by an administrator and cannot be re-registered." },
        { status: 403 }
      );
    }

    // Enforce role separation: an email tied to one role can't register as the other.
    const requestedRole = role === "counsellor" ? "counsellor" : "student";
    const conflict = await checkRoleConflict(email, requestedRole);
    if (conflict) {
      return NextResponse.json({ error: conflict }, { status: 403 });
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
      consent: consent === true,
    }]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
