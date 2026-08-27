import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge";
import { isBanned } from "@/lib/ban";

export async function GET(request: NextRequest) {
  let userId: string | null = null;
  let userName: string | null = null;
  let userEmail: string | null = null;
  let avatarUrl: string | null = null;

  // Try to decode access token from cookie
  const accessToken = request.cookies.get("insforge_access_token")?.value;
  const refreshToken = request.cookies.get("insforge_refresh_token")?.value;

  if (accessToken) {
    try {
      const payload = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64").toString());
      userId = payload.sub || payload.user_id || null;
      userEmail = payload.email || null;
      userName = payload.name || payload.user_metadata?.name || null;
    } catch { /* invalid token */ }
  }

  if (!userId && refreshToken) {
    try {
      const payload = JSON.parse(Buffer.from(refreshToken.split(".")[1], "base64").toString());
      userId = payload.sub || payload.user_id || null;
      userEmail = payload.email || null;
      userName = payload.name || null;
    } catch { /* invalid token */ }
  }

  // Also try getCurrentUser via SDK (works if session is valid)
  if (!userId) {
    try {
      const { data } = await insforgeAdmin.auth.getCurrentUser();
      if (data?.user) {
        userId = data.user.id;
        userEmail = data.user.email ?? null;
        userName = data.user.profile?.name ?? null;
        avatarUrl = data.user.profile?.avatar_url ?? null;
      }
    } catch { /* network/auth error */ }
  }

  if (!userId) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Fetch or create profile from DB
  let role = "student";
  try {
    const { data: profiles } = await insforgeAdmin.database
      .from("student_profiles")
      .select("role, name, avatar_url")
      .eq("id", userId)
      .limit(1);

    if (!profiles || profiles.length === 0) {
      await insforgeAdmin.database.from("student_profiles").insert([{
        id: userId,
        name: userName || userEmail?.split("@")[0] || "Student",
        email: userEmail || "",
        role: "student",
        anonymous_id: userId.slice(0, 8),
      }]).select();
    } else {
      if (profiles[0]?.role) role = profiles[0].role;
      if (profiles[0]?.name) userName = profiles[0].name;
      if (profiles[0]?.avatar_url) avatarUrl = profiles[0].avatar_url;
    }
  } catch { /* DB error — continue with defaults */ }

  // Banned users are treated as signed out: clear their session cookies and
  // return 403 so the client redirects them to sign-in.
  if (role === "banned" || (await isBanned(userId, userEmail))) {
    const banned = NextResponse.json(
      { user: null, banned: true, error: "Your account has been suspended by an administrator." },
      { status: 403 }
    );
    const clear = { path: "/", maxAge: 0 };
    banned.cookies.set("insforge_access_token", "", clear);
    banned.cookies.set("insforge_refresh_token", "", clear);
    banned.cookies.set("user_role", "", clear);
    return banned;
  }

  const response = NextResponse.json({
    user: { id: userId, name: userName, email: userEmail, avatar_url: avatarUrl, role },
  });

  response.cookies.set("user_role", role, {
    path: "/", httpOnly: false, maxAge: 60 * 60 * 24 * 7, sameSite: "lax",
  });

  return response;
}
