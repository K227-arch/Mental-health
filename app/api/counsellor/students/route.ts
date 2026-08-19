import { NextResponse } from "next/server";
import { insforgeAdmin as insforge } from "@/lib/insforge";

export async function GET() {
  try {
    // Fetch all student profiles
    const { data: profiles, error: profilesError } = await insforge.database
      .from("student_profiles")
      .select()
      .order("created_at", { ascending: false });

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    const allProfiles = profiles || [];

    // Get latest screening results for each student
    const studentIds = allProfiles.map((p: any) => p.id);

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

    // Get sessions
    let sessions: any[] = [];
    if (studentIds.length > 0) {
      const { data } = await insforge.database
        .from("counsellor_sessions")
        .select()
        .in("student_id", studentIds)
        .order("updated_at", { ascending: false });
      sessions = data || [];
    }

    // Build student data
    const students = allProfiles.map((profile: any) => {
      const latestScreening = screenings.find((s: any) => s.user_id === profile.id);
      const latestMood = moods.find((m: any) => m.user_id === profile.id);
      const session = sessions.find((s: any) => s.student_id === profile.id);

      const phq9Score = latestScreening?.score || 0;
      const assessmentType = latestScreening?.assessment_type || "none";
      let riskLevel = "Minimal";
      if (phq9Score >= 20) riskLevel = "Critical";
      else if (phq9Score >= 15) riskLevel = "High";
      else if (phq9Score >= 10) riskLevel = "Moderate";

      return {
        id: profile.id,
        sessionId: session?.id || null,
        name: profile.name || "Anonymous Student",
        email: profile.email,
        anonymousId: profile.anonymous_id || profile.id?.slice(0, 8),
        faculty: profile.faculty || "Not specified",
        year: profile.year_of_study || 0,
        role: profile.role || "student",
        riskLevel: session?.risk_level || latestScreening?.risk_level || riskLevel,
        phq9Score,
        assessmentType,
        severity: latestScreening?.severity || "No screening yet",
        moodScore: latestMood?.mood_score || null,
        stressLevel: latestMood?.stress_level || null,
        lastActive: session?.updated_at || latestMood?.created_at || latestScreening?.created_at || profile.created_at,
        status: session?.status || "no session",
        notes: session?.notes || "",
        aiSummary: session?.ai_summary || "",
      };
    });

    return NextResponse.json({ students });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
