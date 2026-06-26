import { NextRequest, NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, counsellorId, referralType, destination, sessionId, notes } = body;

    if (!studentId || !referralType) {
      return NextResponse.json({ error: "studentId and referralType are required" }, { status: 400 });
    }

    const { data, error } = await insforge.database.from("referrals").insert([{
      student_id: studentId,
      counsellor_id: counsellorId || "counsellor",
      referral_type: referralType,
      destination: destination || null,
      session_id: sessionId || null,
      notes: notes || null,
      status: "pending",
    }]).select();

    if (error) return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const studentId = searchParams.get("studentId");
    const counsellorId = searchParams.get("counsellorId");

    let query = insforge.database.from("referrals").select().order("created_at", { ascending: false });
    if (studentId) query = query.eq("student_id", studentId);
    if (counsellorId) query = query.eq("counsellor_id", counsellorId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });

    const { data, error } = await insforge.database.from("referrals")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id).select();

    if (error) return NextResponse.json({ error: "Failed to update referral" }, { status: 500 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
