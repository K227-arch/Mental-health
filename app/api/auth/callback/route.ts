import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("insforge_code");
  const errorMsg = request.nextUrl.searchParams.get("insforge_error");

  if (errorMsg || !code) {
    const url = new URL("/auth/sign-in", request.url);
    if (errorMsg) url.searchParams.set("error", errorMsg);
    return NextResponse.redirect(url);
  }

  const verifier = request.cookies.get("insforge_code_verifier")?.value;
  const redirectTo = request.cookies.get("insforge_redirect")?.value || "/dashboard";

  try {
    // Exchange OAuth code for session
    const { data, error } = await (insforgeAdmin.auth as any).exchangeOAuthCode(code, verifier);

    if (error) {
      const url = new URL("/auth/sign-in", request.url);
      url.searchParams.set("error", error.message);
      return NextResponse.redirect(url);
    }

    // Get user ID from the token to check if they have a profile
    let userId: string | null = null;
    if (data?.accessToken) {
      try {
        const payload = JSON.parse(Buffer.from(data.accessToken.split(".")[1], "base64").toString());
        userId = payload.sub || payload.user_id || null;
      } catch { /* invalid token */ }
    }

    // Check if user has signed up (has a profile in student_profiles or counsellor_profiles)
    if (userId) {
      const { data: studentProfile } = await insforgeAdmin.database
        .from("student_profiles")
        .select("id")
        .eq("id", userId)
        .limit(1);

      const { data: counsellorProfile } = await insforgeAdmin.database
        .from("counsellor_profiles")
        .select("id")
        .eq("id", userId)
        .limit(1);

      const hasProfile =
        (studentProfile && studentProfile.length > 0) ||
        (counsellorProfile && counsellorProfile.length > 0);

      if (!hasProfile) {
        // User authenticated via OAuth but has no profile — they need to sign up first
        const role = redirectTo === "/counsellor" ? "counsellor" : "student";
        const url = new URL("/auth/sign-up", request.url);
        url.searchParams.set("role", role);
        url.searchParams.set("error", "Please complete your registration first. Sign up to create your account.");
        const noProfileResponse = NextResponse.redirect(url);
        noProfileResponse.cookies.set("insforge_code_verifier", "", { path: "/", maxAge: 0 });
        noProfileResponse.cookies.set("insforge_redirect", "", { path: "/", maxAge: 0 });
        return noProfileResponse;
      }
    }

    const response = NextResponse.redirect(new URL(redirectTo, request.url));

    // Set session cookies
    if (data?.accessToken) {
      response.cookies.set("insforge_access_token", data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    if (data?.refreshToken) {
      response.cookies.set("insforge_refresh_token", data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    response.cookies.set("insforge_code_verifier", "", { path: "/", maxAge: 0 });
    response.cookies.set("insforge_redirect", "", { path: "/", maxAge: 0 });
    return response;
  } catch {
    const url = new URL("/auth/sign-in", request.url);
    url.searchParams.set("error", "Authentication failed. Please try again.");
    return NextResponse.redirect(url);
  }
}
