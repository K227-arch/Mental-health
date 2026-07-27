import { NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge";

// Temporary admin endpoint to view all profiles and update roles
export async function GET() {
  try {
    const { data, error } = await insforgeAdmin.database
      .from("student_profiles")
      .select("id, name, email, role, created_at")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profiles: data || [], count: data?.length || 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Fix a user's role
export async function PATCH(request: Request) {
  try {
    const { userId, role } = await request.json();
    if (!userId || !role) return NextResponse.json({ error: "userId and role required" }, { status: 400 });

    const { data, error } = await insforgeAdmin.database
      .from("student_profiles")
      .update({ role })
      .eq("id", userId)
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ updated: data?.[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
