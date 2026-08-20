import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and verification code are required." }, { status: 400 });
    }

    // Verify the OTP code with InsForge
    const { data, error } = await insforgeAdmin.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Invalid or expired verification code." },
        { status: 400 }
      );
    }

    const response: any = { success: true };

    if (data?.accessToken) {
      response.accessToken = data.accessToken;
      response.refreshToken = data.refreshToken;
    }

    if (data?.user?.id) {
      response.userId = data.user.id;
    }

    return NextResponse.json(response);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Verification failed." }, { status: 500 });
  }
}
