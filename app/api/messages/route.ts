import { NextRequest, NextResponse } from "next/server";
import { insforge, detectKeywords } from "@/lib/insforge";

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId");
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 50, 200);

    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const { data, error } = await insforge.database.from("messages")
      .select().eq("session_id", sessionId)
      .order("created_at", { ascending: true }).limit(limit);

    if (error) return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, senderId, senderRole, content } = await request.json();
    if (!sessionId || !senderId || !content) {
      return NextResponse.json({ error: "sessionId, senderId, content required" }, { status: 400 });
    }

    const keywords = detectKeywords(content);
    const { data, error } = await insforge.database.from("messages").insert([{
      session_id: sessionId,
      sender_id: senderId,
      sender_role: senderRole || "student",
      content,
      is_flagged: keywords.length > 0,
    }]).select();

    if (error) return NextResponse.json({ error: "Failed to send message" }, { status: 500 });

    // If flagged — notify counsellor immediately
    if (keywords.length > 0) {
      await insforge.database.from("notifications").insert([{
        user_id: "counsellor",
        title: "⚠️ Flagged Message",
        body: `Message contains crisis keywords: ${keywords.join(", ")}`,
        type: "critical",
        link: `/counsellor/chat?session=${sessionId}&student=${senderId}`,
      }]);
    }

    return NextResponse.json({ data: data?.[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
