import { NextRequest, NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const studentId = searchParams.get("studentId");
    const counsellorId = searchParams.get("counsellorId");
    const status = searchParams.get("status");

    let query = insforge.database.from("counsellor_sessions")
      .select().order("updated_at", { ascending: false });

    if (studentId) query = query.eq("student_id", studentId);
    if (counsellorId) query = query.eq("counsellor_id", counsellorId);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { studentId, counsellorId, riskLevel, phq9Score, studentName } = await request.json();
    if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

    // Check for existing active session
    const { data: existing } = await insforge.database.from("counsellor_sessions")
      .select().eq("student_id", studentId).eq("status", "active").maybeSingle();

    if (existing) return NextResponse.json({ data: existing, existing: true });

    const { data, error } = await insforge.database.from("counsellor_sessions").insert([{
      student_id: studentId,
      counsellor_id: counsellorId || "counsellor",
      status: "active",
      risk_level: riskLevel || "Minimal",
      phq9_score: phq9Score || null,
      student_name: studentName || "Student",
    }]).select();

    if (error) return NextResponse.json({ error: "Failed to create session" }, { status: 500 });

    // Notify counsellor of new session
    await insforge.database.from("notifications").insert([{
      user_id: counsellorId || "counsellor",
      title: "New student session",
      body: `${studentName || "A student"} has started a new session.`,
      type: "info",
      link: "/counsellor",
    }]);

    return NextResponse.json({ data: data?.[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { data, error } = await insforge.database.from("counsellor_sessions")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id).select();

    if (error) return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
    return NextResponse.json({ data: data?.[0] });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
