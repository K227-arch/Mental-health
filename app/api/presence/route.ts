import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge";

// Store presence: POST to update, GET to check
export async function POST(request: NextRequest) {
  try {
    const { userId, role } = await request.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    await insforgeAdmin.database.from("student_profiles").update({
      updated_at: new Date().toISOString(),
    }).eq("id", userId);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// GET: check if a counsellor is online (active within last 2 minutes)
export async function GET(request: NextRequest) {
  try {
    const role = request.nextUrl.searchParams.get("role") || "counsellor";
    const userId = request.nextUrl.searchParams.get("userId");
    const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    if (userId) {
      // Check specific user
      const { data } = await insforgeAdmin.database
        .from("student_profiles")
        .select("id, name, updated_at")
        .eq("id", userId)
        .single();

      const isOnline = data?.updated_at && new Date(data.updated_at) > new Date(twoMinsAgo);
      return NextResponse.json({ online: isOnline, lastSeen: data?.updated_at });
    }

    // Check if any counsellor is online
    const { data } = await insforgeAdmin.database
      .from("student_profiles")
      .select("id, name, updated_at")
      .eq("role", role)
      .gte("updated_at", twoMinsAgo)
      .limit(1);

    return NextResponse.json({
      online: (data?.length || 0) > 0,
      count: data?.length || 0,
      lastSeen: data?.[0]?.updated_at || null,
    });
  } catch {
    return NextResponse.json({ online: false, lastSeen: null });
  }
}
