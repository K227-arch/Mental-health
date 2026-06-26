import { NextRequest, NextResponse } from "next/server";
import { insforge, getSeverity, detectKeywords } from "@/lib/insforge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, score, responses } = body;

    if (!userId || score === undefined) {
      return NextResponse.json({ error: "userId and score are required" }, { status: 400 });
    }

    const sev = getSeverity(score);
    const allText = Object.values(responses || {}).join(" ");
    const keywords = detectKeywords(allText);

    const { data, error } = await insforge.database.from("screening_results").insert([{
      user_id: userId,
      score,
      severity: sev.label,
      risk_level: sev.risk,
      responses: responses || {},
      flagged_keywords: keywords.length > 0 ? keywords : null,
    }]).select();

    if (error) return NextResponse.json({ error: "Failed to save result" }, { status: 500 });

    // Auto-create/update counsellor session if risk is moderate+
    if (sev.risk !== "Minimal") {
      const { data: existing } = await insforge.database
        .from("counsellor_sessions")
        .select()
        .eq("student_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (!existing) {
        await insforge.database.from("counsellor_sessions").insert([{
          student_id: userId,
          counsellor_id: "counsellor",
          status: "active",
          risk_level: sev.risk,
          phq9_score: score,
        }]);
      } else {
        await insforge.database.from("counsellor_sessions")
          .update({ risk_level: sev.risk, phq9_score: score })
          .eq("id", existing.id);
      }

      // Notify counsellor
      await insforge.database.from("notifications").insert([{
        user_id: "counsellor",
        title: `PHQ-9 Alert: ${sev.label} Risk (Score ${score})`,
        body: `A student completed a PHQ-9 screening with score ${score} (${sev.label}).`,
        type: sev.risk === "Critical" ? "critical" : "warning",
        link: "/counsellor",
      }]);
    }

    return NextResponse.json({ data: data?.[0], severity: sev.label, risk: sev.risk }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 10, 50);
    const { data, error } = await insforge.database.from("screening_results")
      .select().eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);

    if (error) return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
