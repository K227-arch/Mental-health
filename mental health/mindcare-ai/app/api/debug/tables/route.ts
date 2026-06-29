import { NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";

export async function GET() {
  try {
    // Try to query each expected table to see what exists
    const tables = [
      "profiles",
      "mood_entries",
      "screening_results",
      "referrals",
      "messages",
      "sessions",
      "notifications",
      "counsellor_assignments",
      "users",
      "students",
    ];

    const results: Record<string, { exists: boolean; count?: number; error?: string }> = {};

    for (const table of tables) {
      try {
        const { data, error } = await insforge.database
          .from(table)
          .select("*", { count: "exact", head: true });
        
        if (error) {
          results[table] = { exists: false, error: error.message };
        } else {
          results[table] = { exists: true, count: 0 };
        }
      } catch (e: any) {
        results[table] = { exists: false, error: e.message };
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
