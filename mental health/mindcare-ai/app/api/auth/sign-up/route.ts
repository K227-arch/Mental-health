import { NextRequest, NextResponse } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";
import { insforgeAdmin as insforge } from "@/lib/insforge";

export async function POST(request: NextRequest) {
  const { email, password, name, redirect: redirectTo } = await request.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
  }

  const response = NextResponse.json({ success: true, redirect: redirectTo || "/dashboard" });

  const auth = createAuthActions({
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  });

  const { data, error } = await auth.signUp({ email, password, name });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Create student profile in database
  const userId = data?.user?.id;
  if (userId) {
    const role = redirectTo === "/counsellor" ? "counsellor" : "student";
    try {
      await insforge.database
        .from("student_profiles")
        .upsert({
          id: userId,
          name,
          email,
          role,
          anonymous_id: userId.slice(0, 8),
        }, { onConflict: "id" });
    } catch {
      // Profile creation is best-effort
    }
  }

  return response;
}
