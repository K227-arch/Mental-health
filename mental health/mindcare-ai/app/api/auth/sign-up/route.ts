import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, redirect: redirectTo } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const { data, error } = await insforgeAdmin.auth.signUp({ email, password, name });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const userId = data?.user?.id;

    // Create student profile in database
    if (userId) {
      const role = redirectTo === "/counsellor" ? "counsellor" : "student";
      try {
        await insforgeAdmin.database.from("student_profiles").upsert([{
          id: userId,
          name,
          email,
          role,
          anonymous_id: userId.slice(0, 8),
        }]);
      } catch {
        // Profile creation is best-effort
      }
    }

    const response = NextResponse.json(
      { success: true, redirect: redirectTo || "/dashboard", requireEmailVerification: data?.requireEmailVerification },
      { status: 201 }
    );

    // Set session cookie if signed in immediately (email verification disabled)
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
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
