import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge";

// Keep-alive endpoint called by a Vercel Cron Job every hour.
// A lightweight SELECT on each major table prevents InsForge from pausing
// the database due to inactivity.
//
// The CRON_SECRET env var protects this route so only Vercel (or you) can
// call it. Vercel sets `Authorization: Bearer <CRON_SECRET>` automatically.

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // Validate the cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start = Date.now();
  const results: Record<string, string> = {};

  // Ping each core table with a minimal 1-row select to keep connections warm.
  const tables = [
    "student_profiles",
    "counsellor_profiles",
    "counsellor_sessions",
    "messages",
    "mood_entries",
    "notifications",
    "screening_results",
  ];

  await Promise.all(
    tables.map(async (table) => {
      try {
        const { data, error } = await insforgeAdmin.database
          .from(table)
          .select("id")
          .limit(1);
        results[table] = error ? `error: ${error.message}` : `ok (${data?.length ?? 0} row)`;
      } catch (err: any) {
        results[table] = `exception: ${err?.message}`;
      }
    })
  );

  const ms = Date.now() - start;

  return NextResponse.json({
    ok: true,
    pingedAt: new Date().toISOString(),
    durationMs: ms,
    tables: results,
  });
}
