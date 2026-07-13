import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/counsellor", "/screening", "/wellness", "/settings", "/crisis", "/messages"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (!isProtected) return NextResponse.next();

  // Check both tokens — if neither exists, user is logged out
  const accessToken = request.cookies.get("insforge_access_token")?.value;
  const refreshToken = request.cookies.get("insforge_refresh_token")?.value;

  if (!accessToken && !refreshToken) {
    const signInUrl = new URL("/auth/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Prevent browser caching of protected pages (so back button doesn't show stale content)
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/counsellor/:path*", "/screening/:path*", "/wellness/:path*", "/settings/:path*", "/crisis/:path*", "/messages/:path*"],
};
