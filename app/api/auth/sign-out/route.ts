import { NextRequest, NextResponse } from "next/server";
import { createAuthActions, clearAuthCookies } from "@insforge/sdk/ssr";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });

  const auth = createAuthActions({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  });

  await auth.signOut();

  // Belt-and-suspenders: explicitly clear auth cookies from the response
  clearAuthCookies(response.cookies);

  return response;
}
