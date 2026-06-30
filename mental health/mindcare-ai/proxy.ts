import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/counsellor", "/screening", "/wellness", "/settings"];

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

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/counsellor/:path*", "/screening/:path*", "/wellness/:path*", "/settings/:path*"],
};
