import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge";

// Simple presence: store last seen in mood_entries with a special emoji marker
// OR just use sessions updated_at for counsellors

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    // Update the profile directly - try updating name (no-op) to refresh updated_at
    // InsForge should support this
    const { error } = await insforgeAdmin.database
      .from("student_profiles")
      .update({ name: undefined } as any)
      .eq("id", userId);

    // If that fails, insert a mood entry as heartbeat
    if (error) {
      await insforgeAdmin.database.from("mood_entries").insert([{
        user_id: userId,
        mood_score: 0,
        emoji: "🟢",
        notes: "presence",
        created_at: new Date().toISOString(),
      }]);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 }); // non-blocking
  }
}

export async function GET(request: NextRequest) {
  try {
    const role = request.nextUrl.searchParams.get("role") || "counsellor";
    const userId = request.nextUrl.searchParams.get("userId");
    const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    if (userId) {
      // Check if specific user has a recent mood_entry heartbeat
      const { data } = await insforgeAdmin.database
        .from("mood_entries")
        .select("created_at")
        .eq("user_id", userId)
        .eq("emoji", "🟢")
        .gte("created_at", twoMinsAgo)
        .order("created_at", { ascending: false })
        .limit(1);

      // Also check last mood entry for "last seen"
      const { data: lastSeen } = await insforgeAdmin.database
        .from("mood_entries")
        .select("created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      return NextResponse.json({
        online: (data?.length || 0) > 0,
        lastSeen: lastSeen?.[0]?.created_at || null,
      });
    }

    // Check if any user with given role is online
    const { data: profiles } = await insforgeAdmin.database
      .from("student_profiles")
      .select("id")
      .eq("role", role)
      .limit(20);

    if (!profiles?.length) return NextResponse.json({ online: false, lastSeen: null });

    const ids = profiles.map((p: any) => p.id);
    const { data: recent } = await insforgeAdmin.database
      .from("mood_entries")
      .select("user_id, created_at")
      .in("user_id", ids)
      .eq("emoji", "🟢")
      .gte("created_at", fiveMinsAgo)
      .order("created_at", { ascending: false })
      .limit(5);

    // Fallback: also check sessions updated recently
    const { data: sessions } = await insforgeAdmin.database
      .from("counsellor_sessions")
      .select("counsellor_id, updated_at")
      .gte("updated_at", fiveMinsAgo)
      .order("updated_at", { ascending: false })
      .limit(1);

    const isOnlineViaSession = (sessions?.length || 0) > 0;
    const isOnlineViaHeartbeat = (recent?.length || 0) > 0;

    return NextResponse.json({
      online: isOnlineViaHeartbeat || isOnlineViaSession,
      count: (recent?.length || 0),
      lastSeen: recent?.[0]?.created_at || sessions?.[0]?.updated_at || null,
    });
  } catch {
    return NextResponse.json({ online: false, lastSeen: null });
  }
}
