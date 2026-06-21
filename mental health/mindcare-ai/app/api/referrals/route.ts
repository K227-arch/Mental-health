import { NextRequest, NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, counsellorId, reason, type } = body;

    if (!userId || !counsellorId || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: userId, counsellorId, reason" },
        { status: 400 }
      );
    }

    const { data, error } = await insforge
      .database
      .from("referrals")
      .insert({
        user_id: userId,
        counsellor_id: counsellorId,
        reason,
        type: type || "general",
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create referral" },
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
    const counsellorId = searchParams.get("counsellorId");

    let query = insforge.database.from("referrals").select();

    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (counsellorId) {
      query = query.eq("counsellor_id", counsellorId);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch referrals" },
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
