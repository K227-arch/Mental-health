import { NextRequest, NextResponse } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";

export async function POST(request: NextRequest) {
  const { email, password, name, redirect: redirectTo } = await request.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
  }

  const response = NextResponse.json({ success: true, redirect: redirectTo || "/dashboard" });

  const auth = createAuthActions({
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  });

  const { error } = await auth.signUp({ email, password, name });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return response;
}