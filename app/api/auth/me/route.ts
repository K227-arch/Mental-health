import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@insforge/sdk/ssr";

export async function GET(request: NextRequest) {
  // Build a server-side InsForge client that reads the session from cookies
  const client = createServerClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    cookies: request.cookies,
  });

  const { data, error } = await client.auth.getCurrentUser();

  if (error || !data?.user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.profile?.name ?? null,
      avatar_url: data.user.profile?.avatar_url ?? null,
      role: (data.user.profile as any)?.role ?? "student",
    },
  });
}
