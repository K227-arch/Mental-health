import { NextRequest, NextResponse } from "next/server";

// This route handles setting httpOnly cookies after client-side sign-in
// The actual authentication is done client-side via the InsForge SDK
export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken, redirect } = await request.json();

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
