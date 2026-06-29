import { NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";

export async function GET() {
  try {
    // Get all active counsellor sessions with student data
    const { data: sessions, error } = await insforge.database
      .from("counsellor_sessions")
      .select()
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get latest screening results for each student
    const studentIds = [...new Set((sessions || []).map((s: any) => s.student_id))];

    let screenings: any[] = [];
    if (studentIds.length > 0) {
      const { data } = await insforge.database
        .from("screening_results")
        .select()
        .in("user_id", studentIds)
        .order("created_at", { ascending: false });
      screenings = data || [];
    }

    // Get latest mood entries
    let moods: any[] = [];
    if (studentIds.length > 0) {
      const { data } = await insforge.database
        .from("mood_entries")
        .select()
        .in("user_id", studentIds)
        .order("created_at", { ascending: false });
      moods = data || [];
    }

    // Combine data per student
    const students = (sessions || []).map((session: any) => {
      const latestScreening = screenings.find((s: any) => s.user_id === session.student_id);
      const latestMood = moods.find((m: any) => m.user_id === session.student_id);

      return {
        id: session.student_id,
        sessionId: session.id,
        name: session.student_name || "Anonymous Student",
        anonymousId: session.student_id?.slice(0, 8) || "unknown",
        riskLevel: session.risk_level || latestScreening?.risk_level || "Moderate",
        phq9Score: session.phq9_score || latestScreening?.score || 0,
        severity: latestScreening?.severity || "Unknown",
        moodScore: latestMood?.mood_score || null,
        stressLevel: latestMood?.stress_level || null,
        lastActive: session.updated_at,
        status: session.status,
        notes: session.notes,
        aiSummary: session.ai_summary,
        interventionLogged: session.intervention_logged,
      };
    });

    return NextResponse.json({ students });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
