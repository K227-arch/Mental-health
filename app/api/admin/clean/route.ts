import { NextRequest, NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";

// One-time cleanup route — deletes all rows from all app tables
// Protected by API key header
export async function DELETE(request: NextRequest) {
  const key = request.headers.get("x-admin-key");
  if (key !== process.env.INSFORGE_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tables = [
    "messages",
    "notifications",
    "mood_entries",
    "screening_results",
    "wellness_activities",
    "referrals",
    "crisis_safety_plans",
    "counsellor_sessions",
    "student_profiles",
  ];

  const results: Record<string, string> = {};

  for (const table of tables) {
    try {
      // Delete all rows — using neq on id as a workaround (no unconditional delete in PostgREST)
      const { error } = await insforge.database
        .from(table)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      results[table] = error ? `ERROR: ${error.message}` : "cleaned";
    } catch (e: any) {
      results[table] = `EXCEPTION: ${e.message}`;
    }
  }

  return NextResponse.json({ success: true, results });
}
