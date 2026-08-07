import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge";

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

  // Role resolution: check dedicated tables first (counsellor_profiles, admin_profiles),
  // then fall back to student_profiles. This ensures counsellors/admins are always
  // identified correctly even if they also have a backfilled row in student_profiles.
  let role = "student";
  try {
    const [counsellorRes, adminRes, studentRes] = await Promise.all([
      insforgeAdmin.database
        .from("counsellor_profiles")
        .select("role, name, avatar_url")
        .eq("id", userId)
        .limit(1),
      insforgeAdmin.database
        .from("admin_profiles")
        .select("role, name, avatar_url")
        .eq("id", userId)
        .limit(1),
      insforgeAdmin.database
        .from("student_profiles")
        .select("role, name, avatar_url")
        .eq("id", userId)
        .limit(1),
    ]);

    const counsellorProfile = counsellorRes.data?.[0];
    const adminProfile = adminRes.data?.[0];
    const studentProfile = studentRes.data?.[0];

    if (counsellorProfile) {
      // Dedicated counsellor table takes highest priority
      role = "counsellor";
      if (counsellorProfile.name?.trim()) userName = counsellorProfile.name;
      if (counsellorProfile.avatar_url) avatarUrl = counsellorProfile.avatar_url;
    } else if (adminProfile) {
      // Dedicated admin table takes second priority
      role = "administrator";
      if (adminProfile.name?.trim()) userName = adminProfile.name;
      if (adminProfile.avatar_url) avatarUrl = adminProfile.avatar_url;
    } else if (studentProfile) {
      // Student table — use whatever role is stored there
      role = studentProfile.role || "student";
      if (studentProfile.name?.trim()) userName = studentProfile.name;
      if (studentProfile.avatar_url) avatarUrl = studentProfile.avatar_url;
    } else {
      // New user — create a student profile
      await insforgeAdmin.database.from("student_profiles").insert([{
        id: userId,
        name: userName || userEmail?.split("@")[0] || "Student",
        email: userEmail || "",
        role: "student",
        anonymous_id: userId.slice(0, 8),
      }]).catch(() => {}); // non-blocking, ignore duplicate errors
    }
  } catch { /* DB error — continue with defaults */ }

  const response = NextResponse.json({
    user: { id: userId, name: userName, email: userEmail, avatar_url: avatarUrl, role },
  });

  response.cookies.set("user_role", role, {
    path: "/", httpOnly: false, maxAge: 60 * 60 * 24 * 7, sameSite: "lax",
  });

  return response;
}
