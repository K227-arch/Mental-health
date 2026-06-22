import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@insforge/sdk/ssr";

export async function GET(request: NextRequest) {
  const client = createServerClient({
    cookies: request.cookies,
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
  });

  const { data, error } = await client.auth.getCurrentUser();

  if (error || !data?.user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      name: data.user.profile?.name ?? null,
      email: data.user.email,
      avatar_url: data.user.profile?.avatar_url ?? null,
    },
  });
}
