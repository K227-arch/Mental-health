import { NextRequest, NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const { data, error } = await insforge.database.from("notifications")
      .select().eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(30);

    if (error) return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, userId } = await request.json();

    if (id) {
      await insforge.database.from("notifications").update({ is_read: true }).eq("id", id);
    } else if (userId) {
      await insforge.database.from("notifications").update({ is_read: true }).eq("user_id", userId);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
