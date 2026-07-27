import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge";

// POST: heartbeat — called every 60s by Navbar when user is logged in
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ ok: false });

    const now = new Date().toISOString();

    // Insert a heartbeat record in mood_entries with a special marker
    // Use upsert-like behavior: insert new record each time (cheap, fast)
    await insforgeAdmin.database.from("mood_entries").insert([{
      user_id: userId,
      mood_score: 0,
      emoji: "⬤",
      notes: `heartbeat:${now}`,
      created_at: now,
    }]);

    return NextResponse.json({ ok: true });
  } catch {
    // Non-blocking — heartbeat failure should never break the UI
    return NextResponse.json({ ok: true });
  }
}

// GET: check if user(s) are online
export async function GET(request: NextRequest) {
  try {
    const role = request.nextUrl.searchParams.get("role") || "counsellor";
    const userId = request.nextUrl.searchParams.get("userId");

    // Consider online if heartbeat within last 3 minutes
    const threeMinAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    // Last seen = last heartbeat ever
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

    if (userId) {
      // Check specific user's heartbeat
      const { data: recent } = await insforgeAdmin.database
        .from("mood_entries")
        .select("created_at")
        .eq("user_id", userId)
        .eq("emoji", "⬤")
        .gte("created_at", threeMinAgo)
        .limit(1);

      const { data: lastBeat } = await insforgeAdmin.database
        .from("mood_entries")
        .select("created_at")
        .eq("user_id", userId)
        .eq("emoji", "⬤")
        .order("created_at", { ascending: false })
        .limit(1);

      return NextResponse.json({
        online: (recent?.length || 0) > 0,
        lastSeen: lastBeat?.[0]?.created_at || null,
      });
    }

    // Check if any user with given role is online
    const { data: profiles } = await insforgeAdmin.database
      .from("student_profiles")
      .select("id")
      .eq("role", role)
      .limit(20);

    if (!profiles?.length) {
      return NextResponse.json({ online: false, lastSeen: null });
    }

    const ids = profiles.map((p: any) => p.id);

    const { data: recent } = await insforgeAdmin.database
      .from("mood_entries")
      .select("user_id, created_at")
      .in("user_id", ids)
      .eq("emoji", "⬤")
      .gte("created_at", threeMinAgo)
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: lastBeat } = await insforgeAdmin.database
      .from("mood_entries")
      .select("user_id, created_at")
      .in("user_id", ids)
      .eq("emoji", "⬤")
      .order("created_at", { ascending: false })
      .limit(1);

    return NextResponse.json({
      online: (recent?.length || 0) > 0,
      count: recent?.length || 0,
      lastSeen: lastBeat?.[0]?.created_at || null,
    });
  } catch (e: any) {
    return NextResponse.json({ online: false, lastSeen: null });
  }
}
