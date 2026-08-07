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

    const preview = content.length > 80 ? content.slice(0, 80) + "..." : content;

    if (senderRole === "student") {
      // Notify the counsellor-system broadcast channel (all counsellors see it)
      await insforge.database.from("notifications").insert({
        user_id: "counsellor-system",
        title: "💬 New Student Message",
        body: preview,
        type: "message",
        link: "/counsellor/chat",
      }).catch(() => {});

      // Also notify the specific counsellor assigned to this session (if not system)
      const { data: session } = await insforge.database
        .from("counsellor_sessions")
        .select("counsellor_id")
        .eq("id", sessionId)
        .single()
        .catch(() => ({ data: null }));

      const counsellorId = session?.counsellor_id;
      if (counsellorId && counsellorId !== "counsellor-system" && counsellorId !== "system-assigned") {
        await insforge.database.from("notifications").insert({
          user_id: counsellorId,
          title: "💬 New Message from Student",
          body: preview,
          type: "message",
          link: "/counsellor/chat",
        }).catch(() => {});
      }
    } else if (senderRole === "counsellor") {
      // Notify the student who owns this session
      const studentId = body.studentId;
      if (studentId) {
        await insforge.database.from("notifications").insert({
          user_id: studentId,
          title: "💬 New Message from Your Counsellor",
          body: preview,
          type: "message",
          link: "/dashboard/chat",
        }).catch(() => {});
      } else {
        // Look up student from session
        const { data: session } = await insforge.database
          .from("counsellor_sessions")
          .select("student_id")
          .eq("id", sessionId)
          .single()
          .catch(() => ({ data: null }));

        if (session?.student_id) {
          await insforge.database.from("notifications").insert({
            user_id: session.student_id,
            title: "💬 New Message from Your Counsellor",
            body: preview,
            type: "message",
            link: "/dashboard/chat",
          }).catch(() => {});
        }
      }
    }

    return NextResponse.json({ message: data?.[0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
