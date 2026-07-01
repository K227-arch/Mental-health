import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin as insforge } from "@/lib/insforge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const { data, error } = await insforge.database
      .from("messages")
      .select()
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, senderId, senderRole, content } = body;

    if (!sessionId || !senderId || !senderRole || !content) {
      return NextResponse.json(
        { error: "sessionId, senderId, senderRole, and content are required" },
        { status: 400 }
      );
    }

    const { data, error } = await insforge.database
      .from("messages")
      .insert({
        session_id: sessionId,
        sender_id: senderId,
        sender_role: senderRole,
        content,
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also create a notification for the recipient
    const notifUserId = senderRole === "counsellor" ? body.studentId : body.counsellorId;
    if (notifUserId && notifUserId !== "counsellor-system") {
      await insforge.database.from("notifications").insert({
        user_id: notifUserId,
        title: senderRole === "counsellor" ? "New Message from Counsellor" : "New Message from Student",
        body: content.length > 50 ? content.slice(0, 50) + "..." : content,
        type: "message",
        link: senderRole === "counsellor" ? "/dashboard/chat" : "/counsellor/chat",
      });
    }

    // If student sends and counsellorId is "counsellor-system", notify all counsellors via system
    if (senderRole === "student" && (!body.counsellorId || body.counsellorId === "counsellor-system")) {
      await insforge.database.from("notifications").insert({
        user_id: "counsellor-system",
        title: "New Student Message",
        body: content.length > 50 ? content.slice(0, 50) + "..." : content,
        type: "message",
        link: "/counsellor/chat",
      });
    }

    return NextResponse.json({ message: data?.[0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
