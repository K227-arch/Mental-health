import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@insforge/sdk/ssr";
import { insforge, insforgeAdmin } from "@/lib/insforge";

export async function GET(request: NextRequest) {
  const client = createServerClient({
    cookies: request.cookies,
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
  });

  const { data, error } = await client.auth.getCurrentUser();

  if (error || !data?.user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Fetch role from student_profiles — create if not exists
  let role = "student";
  const { data: profile } = await insforgeAdmin.database
    .from("student_profiles")
    .select("role")
    .eq("id", data.user.id)
    .limit(1);

  if (!profile || profile.length === 0) {
    // Profile doesn't exist — create one using admin client
    await insforgeAdmin.database
      .from("student_profiles")
      .insert({
        id: data.user.id,
        name: data.user.profile?.name || data.user.email?.split("@")[0] || "Student",
        email: data.user.email || "",
        role: "student",
        anonymous_id: data.user.id.slice(0, 8),
      });
  } else if (profile[0]?.role) {
    role = profile[0].role;
  }

  const response = NextResponse.json({
    user: {
      id: data.user.id,
      name: data.user.profile?.name ?? null,
      email: data.user.email,
      avatar_url: data.user.profile?.avatar_url ?? null,
      role,
    },
  });

  // Set role cookie for proxy middleware
  response.cookies.set("user_role", role, {
    path: "/",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "lax",
  });

  return response;
}
