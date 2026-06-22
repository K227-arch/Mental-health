import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/counsellor", "/screening", "/wellness", "/crisis"];
const ADMIN_EMAIL = "keithtwesigye74@gmail.com";

function base64urlDecode(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  return atob(base64);
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (!isProtected) return NextResponse.next();

  const refreshToken = request.cookies.get("insforge_refresh_token")?.value;
  if (!refreshToken) {
    const signInUrl = new URL("/auth/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Counsellor route — admin only via JWT email check
  if (pathname.startsWith("/counsellor")) {
    const accessToken = request.cookies.get("insforge_access_token")?.value;
    if (!accessToken) return NextResponse.redirect(new URL("/dashboard", request.url));

    try {
      const payload = JSON.parse(base64urlDecode(accessToken.split(".")[1]));
      if (payload.email !== ADMIN_EMAIL) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/counsellor/:path*", "/screening/:path*", "/wellness/:path*", "/crisis/:path*"],
};
