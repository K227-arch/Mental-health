import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge";

// This route only handles profile creation after client-side sign-up
export async function POST(request: NextRequest) {
  try {
    const { userId, name, email, role, studentId, faculty, yearOfStudy, registrationNumber } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const profileData = {
      id: userId,
      name: name || email?.split("@")[0] || "User",
      email: email || "",
      role: role || "student",
      anonymous_id: userId.slice(0, 8),
    };

    if (role === "counsellor") {
      // Store counsellors in their own table
      await insforgeAdmin.database.from("counsellor_profiles").upsert([{
        ...profileData,
        faculty: faculty || null,
      }]);
    } else if (role === "administrator") {
      // Store admins in their own table
      await insforgeAdmin.database.from("admin_profiles").upsert([profileData]);
    } else {
      // Students go in student_profiles
      await insforgeAdmin.database.from("student_profiles").upsert([{
        ...profileData,
        student_id: (role === "student" && studentId) ? studentId : null,
        faculty: (role === "student" && faculty) ? faculty : null,
        registration_number: (role === "student" && registrationNumber) ? registrationNumber : null,
      }]);
    }

    // Also keep in student_profiles for backwards compatibility (counsellor_sessions references it)
    if (role === "counsellor" || role === "administrator") {
      await insforgeAdmin.database.from("student_profiles").upsert([profileData]).select();
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
