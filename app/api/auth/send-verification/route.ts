import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    // Resend verification OTP via InsForge
    const { error } = await insforgeAdmin.auth.resendVerification({
      email,
      type: "email",
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to send verification code." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send code." }, { status: 500 });
  }
}
