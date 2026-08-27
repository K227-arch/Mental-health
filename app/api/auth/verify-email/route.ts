import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL;

// Verifies the 6-digit code InsForge emailed the user during sign-up.
// Uses the REST endpoint directly (web client) so we reliably receive the
// access token back and can establish the session immediately.
export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and verification code are required." }, { status: 400 });
    }

    const res = await fetch(`${BASE_URL}/api/auth/email/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: String(code) }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || data?.error || "Invalid or expired verification code." },
        { status: res.status === 400 || res.status === 401 ? 400 : res.status }
      );
    }

    const response = NextResponse.json({
      success: true,
      userId: data?.user?.id ?? null,
      email: data?.user?.email ?? email,
      accessToken: data?.accessToken ?? null,
    });

    // Establish the session if the verify response returned an access token.
    if (data?.accessToken) {
      response.cookies.set("insforge_access_token", data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Verification failed." }, { status: 500 });
  }
}
