import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge";

// Get all counsellors from the dedicated counsellor_profiles table
export async function GET() {
  try {
    const { data, error } = await insforgeAdmin.database
      .from("counsellor_profiles")
      .select("id, name, email, role, faculty, specialization, created_at")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ counsellors: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Add a counsellor to the counsellor_profiles table
export async function POST(request: NextRequest) {
  try {
    const { userId, name, email, role, faculty } = await request.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const { data, error } = await insforgeAdmin.database
      .from("counsellor_profiles")
      .upsert([{
        id: userId,
        name: name || email?.split("@")[0] || "Counsellor",
        email: email || "",
        role: role || "counsellor",
        faculty: faculty || null,
        anonymous_id: userId.slice(0, 8),
      }]).select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ counsellor: data?.[0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
