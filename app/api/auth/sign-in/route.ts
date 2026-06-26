import { NextRequest, NextResponse } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";
import { createClient } from "@insforge/sdk";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const response = NextResponse.json({ success: true });

  const auth = createAuthActions({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  });

  const { error } = await auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // Determine user role for redirect hint
  const client = createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
  });
  const { data: userData } = await client.auth.signInWithPassword({ email, password });
  const userId = userData?.user?.id;

  let redirect = "/dashboard";
  if (userId) {
    const { data: profile } = await client.database
      .from("student_profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if ((profile as any)?.role === "counsellor") redirect = "/counsellor";
  }

  return NextResponse.json({ success: true, redirect });
}
