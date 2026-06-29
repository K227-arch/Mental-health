import { NextRequest, NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, moodScore, stressLevel, notes } = body;

    if (!userId || moodScore === undefined || stressLevel === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: userId, moodScore, stressLevel" },
        { status: 400 }
      );
    }

    const { data, error } = await insforge
      .database
      .from("mood_entries")
      .insert({
        user_id: userId,
        mood_score: moodScore,
        stress_level: stressLevel,
        notes: notes || "",
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      return NextResponse.json(
        { error: "Failed to save mood entry" },
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required query parameter: userId" },
        { status: 400 }
      );
    }

    const limit = Math.min(Number(searchParams.get("limit")) || 30, 100);

    const { data, error } = await insforge
      .database
      .from("mood_entries")
      .select()
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch mood entries" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}