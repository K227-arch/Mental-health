import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@insforge/sdk/ssr";

// Routes that require a valid session
const PROTECTED = [
  "/dashboard", "/screening", "/wellness", "/messages",
  "/profile", "/notifications", "/safety-plan", "/schedule",
];
const COUNSELLOR_PROTECTED = ["/counsellor"];
// Routes that redirect authed users away
const AUTH_ROUTES = ["/auth/sign-in", "/auth/sign-up", "/auth/forgot-password"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Build the mutable response early so we can write refreshed cookies back
  const response = NextResponse.next();

  // Silently refresh the session — writes updated tokens into response cookies
  let accessToken: string | null = null;
  try {
    const result = await updateSession({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      // Provide a simple reader (InsForge needs .get(name) → string | null)
      requestCookies: {
        get: (name: string) => request.cookies.get(name)?.value ?? null,
      } as any,
      responseCookies: response.cookies as any,
    });
    accessToken = result.accessToken;
  } catch {
    // updateSession failure is non-fatal — just treat as unauthenticated
  }

  const isAuthed = !!accessToken;

  // Redirect already-signed-in users away from auth pages
  if (isAuthed && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users away from protected pages
  if (!isAuthed) {
    const needsAuth =
      PROTECTED.some((r) => pathname.startsWith(r)) ||
      COUNSELLOR_PROTECTED.some((r) => pathname.startsWith(r));

    if (needsAuth) {
      const loginUrl = new URL("/auth/sign-in", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
