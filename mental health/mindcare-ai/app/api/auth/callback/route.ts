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
