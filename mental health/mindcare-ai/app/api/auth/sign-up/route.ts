import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge";

// This route only handles profile creation after client-side sign-up
export async function POST(request: NextRequest) {
  try {
    const { userId, name, email, role } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    await insforgeAdmin.database.from("student_profiles").upsert([{
      id: userId,
      name: name || email?.split("@")[0] || "Student",
      email: email || "",
      role: role || "student",
      anonymous_id: userId.slice(0, 8),
    }]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
