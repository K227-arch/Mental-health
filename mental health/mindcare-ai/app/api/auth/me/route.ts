import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@insforge/sdk/ssr";
import { insforge } from "@/lib/insforge";

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

  // Fetch role from student_profiles
  let role = "student";
  try {
    const { data: profile } = await insforge.database
      .from("student_profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    if (profile?.role) {
      role = profile.role;
    }
  } catch {
    // Profile may not exist yet
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
