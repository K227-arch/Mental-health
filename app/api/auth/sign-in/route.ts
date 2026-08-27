import { NextRequest, NextResponse } from "next/server";
import { isBanned } from "@/lib/ban";
import { checkRoleConflict } from "@/lib/roles";

// This route handles setting httpOnly cookies after client-side sign-in
// The actual authentication is done client-side via the InsForge SDK
export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken, redirect } = await request.json();

    // Reject suspended accounts + cross-role sign-ins before granting a session.
    if (accessToken) {
      try {
        const payload = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64").toString());
        const userId = payload.sub || payload.user_id || null;
        const email = payload.email || null;
        if (await isBanned(userId, email)) {
          return NextResponse.json(
            { error: "Your account has been suspended by an administrator. Contact support if you believe this is a mistake." },
            { status: 403 }
          );
        }

        // A student email cannot sign in through the counsellor portal (and
        // vice versa). The intended portal is carried in `redirect`.
        const requestedRole = redirect === "/counsellor" ? "counsellor" : "student";
        const conflict = await checkRoleConflict(email, requestedRole);
        if (conflict) {
          return NextResponse.json({ error: conflict }, { status: 403 });
        }
      } catch { /* if we can't verify, fall through — /api/auth/me still guards */ }
    }

    const response = NextResponse.json({
      success: true,
      redirect: redirect || "/dashboard",
    });

    if (accessToken) {
      response.cookies.set("insforge_access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    if (refreshToken) {
      response.cookies.set("insforge_refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  } catch {
    return NextResponse.json({ error: "Failed to set session" }, { status: 500 });
  }
}
