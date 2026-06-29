import { NextRequest, NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const { data, error } = await insforge.database
      .from("student_profiles")
      .select()
      .eq("id", userId)
      .single();

    if (error) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, faculty, yearOfStudy, languagePreference } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Upsert profile
    const { data, error } = await insforge.database
      .from("student_profiles")
      .upsert({
        id: userId,
        name: name || undefined,
        faculty: faculty || undefined,
        year_of_study: yearOfStudy || undefined,
        language_preference: languagePreference || undefined,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data?.[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
