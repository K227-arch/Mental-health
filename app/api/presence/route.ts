import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge";

// 5-minute online window
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ ok: false });

    const now = new Date().toISOString();
    const presenceId = `online-${userId}`;

    // Delete old presence record then insert fresh one
    await insforgeAdmin.database.from("notifications")
      .delete().eq("user_id", presenceId);

    await insforgeAdmin.database.from("notifications").insert([{
      user_id: presenceId,
      title: "presence",
      body: now,
      type: "presence",
      is_read: false,
      link: null,
      created_at: now,
    }]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // non-blocking
  }
}

export async function GET(request: NextRequest) {
  try {
    const role = request.nextUrl.searchParams.get("role") || "counsellor";
    const userId = request.nextUrl.searchParams.get("userId");
    const since = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();

    if (userId) {
      // Check specific user
      const { data } = await insforgeAdmin.database
        .from("notifications")
        .select("body, created_at")
        .eq("user_id", `online-${userId}`)
        .eq("type", "presence")
        .single();

      const ts = data?.body || data?.created_at;
      const online = !!ts && new Date(ts) > new Date(since);
      return NextResponse.json({ online, lastSeen: ts || null });
    }

    // Check any user with given role
    const { data: profiles } = await insforgeAdmin.database
      .from("student_profiles")
      .select("id")
      .eq("role", role)
      .limit(50);

    if (!profiles?.length) {
      return NextResponse.json({ online: false, lastSeen: null });
    }

    const presenceIds = profiles.map((p: any) => `online-${p.id}`);

    const { data: records } = await insforgeAdmin.database
      .from("notifications")
      .select("user_id, body, created_at")
      .in("user_id", presenceIds)
      .eq("type", "presence")
      .gte("created_at", since)
      .limit(10);

    const online = (records?.length || 0) > 0;
    const lastSeen = records?.[0]?.body || records?.[0]?.created_at || null;

    return NextResponse.json({ online, count: records?.length || 0, lastSeen });
  } catch (e: any) {
    return NextResponse.json({ online: false, lastSeen: null });
  }
}
