import { NextRequest, NextResponse } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";
import { insforge } from "@/lib/insforge";

export async function POST(request: NextRequest) {
  const { email, password, name, role, faculty, year } = await request.json();

  if (!email || !password || !name) {
    return NextResponse.json(
      { error: "Name, email, and password are required" },
      { status: 400 }
    );
  }

  const response = NextResponse.json({ success: true });

  const auth = createAuthActions({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  });

  const { data, error } = await auth.signUp({ email, password, name });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Create student_profiles row
  if (data?.user) {
    await insforge.database.from("student_profiles").insert([{
      id: data.user.id,
      name,
      email,
      role: role || "student",
      faculty: faculty || null,
      year_of_study: year ? parseInt(year) : null,
      anonymous_id: `Student #${Math.floor(1000 + Math.random() * 9000)}`,
    }]);
  }

  return NextResponse.json({
    success: true,
    requireEmailVerification: data?.requireEmailVerification ?? false,
  });
}
