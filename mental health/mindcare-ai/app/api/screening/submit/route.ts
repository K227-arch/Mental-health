import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin as insforge } from "@/lib/insforge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, score, severity, responses, assessmentType } = body;

    if (!userId || score === undefined || !severity) {
      return NextResponse.json(
        { error: "Missing required fields: userId, score, severity" },
        { status: 400 }
      );
    }

    const { data, error } = await insforge
      .database
      .from("screening_results")
      .insert({
        user_id: userId,
        score,
        severity,
        responses: responses || [],
        assessment_type: assessmentType || "phq9",
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      return NextResponse.json(
        { error: "Failed to save screening result" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
