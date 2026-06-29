import { NextRequest, NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const studentId = searchParams.get("studentId");
    const counsellorId = searchParams.get("counsellorId");

    let query = insforge.database.from("counsellor_sessions").select();

    if (studentId) {
      query = query.eq("student_id", studentId);
    }
    if (counsellorId) {
      query = query.eq("counsellor_id", counsellorId);
    }

    query = query.order("updated_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sessions: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, counsellorId, riskLevel, notes, studentName } = body;

    if (!studentId || !counsellorId) {
      return NextResponse.json({ error: "studentId and counsellorId required" }, { status: 400 });
    }

    const { data, error } = await insforge.database
      .from("counsellor_sessions")
      .insert({
        student_id: studentId,
        counsellor_id: counsellorId,
        status: "active",
        risk_level: riskLevel || "Moderate",
        notes: notes || "",
        student_name: studentName || "Anonymous Student",
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ session: data?.[0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
