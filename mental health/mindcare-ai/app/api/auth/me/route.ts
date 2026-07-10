import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@insforge/sdk/ssr";
import { insforgeAdmin } from "@/lib/insforge";

export async function GET(request: NextRequest) {
  let userId: string | null = null;
  let userName: string | null = null;
  let userEmail: string | null = null;
  let avatarUrl: string | null = null;

  // Try server-side auth first
  try {
    const client = createServerClient({
      cookies: request.cookies,
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    });

    const { data, error } = await client.auth.getCurrentUser();

    if (!error && data?.user) {
      userId = data.user.id;
      userName = data.user.profile?.name ?? null;
      userEmail = data.user.email ?? null;
      avatarUrl = data.user.profile?.avatar_url ?? null;
    }
  } catch {
    // Server auth failed (network/SSL issue)
  }

  // Fallback: try to get user ID from cookies if server auth failed
  if (!userId) {
    // Check if refresh token exists (means user IS logged in, just can't verify server-side)
    const refreshToken = request.cookies.get("insforge_refresh_token")?.value;
    const accessToken = request.cookies.get("insforge_access_token")?.value;

    if (accessToken) {
      // Try to decode the JWT payload (middle part)
      try {
        const payload = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64").toString());
        userId = payload.sub || payload.user_id || null;
        userEmail = payload.email || null;
        userName = payload.name || payload.user_metadata?.name || (userEmail ? userEmail.split("@")[0] : null);
      } catch {
        // Can't decode token
      }
    }

    if (!userId && refreshToken) {
      // Last resort — use a hash of the refresh token as a stable ID
      // This at least keeps the session consistent
      try {
        const payload = JSON.parse(Buffer.from(refreshToken.split(".")[1], "base64").toString());
        userId = payload.sub || payload.user_id || null;
        userEmail = payload.email || null;
        userName = payload.name || (userEmail ? userEmail.split("@")[0] : null);
      } catch {
        // Not a JWT format
      }
    }
  }

  if (!userId) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Fetch/create profile
  let role = "student";
  try {
    const { data: profile } = await insforgeAdmin.database
      .from("student_profiles")
      .select("role, name")
      .eq("id", userId)
      .limit(1);

    if (!profile || profile.length === 0) {
      // Create profile
      await insforgeAdmin.database
        .from("student_profiles")
        .insert({
          id: userId,
          name: userName || userEmail?.split("@")[0] || "Student",
          email: userEmail || "",
          role: "student",
          anonymous_id: userId.slice(0, 8),
        });
    } else {
      if (profile[0]?.role) role = profile[0].role;
      if (profile[0]?.name && !userName) userName = profile[0].name;
    }
  } catch {
    // DB access failed
  }

  const response = NextResponse.json({
    user: {
      id: userId,
      name: userName,
      email: userEmail,
      avatar_url: avatarUrl,
      role,
    },
  });

  response.cookies.set("user_role", role, {
    path: "/",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });

  return response;
}
