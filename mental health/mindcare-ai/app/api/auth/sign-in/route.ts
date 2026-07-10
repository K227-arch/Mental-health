import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge";

export async function POST(request: NextRequest) {
  try {
    const { email, password, redirect: redirectTo } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const { data, error } = await insforgeAdmin.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json({ error: error.message || "Invalid email or password" }, { status: 400 });
    }

    const response = NextResponse.json(
      { success: true, redirect: redirectTo || "/dashboard", user: { id: data?.user?.id, email: data?.user?.email, name: data?.user?.profile?.name } },
      { status: 200 }
    );

    // Set httpOnly cookies for session
    if (data?.accessToken) {
      response.cookies.set("insforge_access_token", data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
