import { NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge";

export async function POST() {
  try {
    await insforgeAdmin.auth.signOut();
  } catch {
    // best-effort
  }

  const response = NextResponse.json({ success: true });

  // Clear all auth cookies
  const cookieOptions = { path: "/", maxAge: 0 };
  response.cookies.set("insforge_access_token", "", cookieOptions);
  response.cookies.set("insforge_refresh_token", "", cookieOptions);
  response.cookies.set("user_role", "", cookieOptions);

  return response;
}
