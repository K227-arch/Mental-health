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

    // Get flagged messages
    let flaggedMessages: any[] = [];
    if (studentIds.length > 0) {
      const { data } = await insforge.database
        .from("messages")
        .select()
        .in("sender_id", studentIds)
        .eq("is_flagged", true)
        .order("created_at", { ascending: false })
        .limit(100);
      flaggedMessages = data || [];
    }

    // Get notifications (analysis results sent by AI modules)
    let notifications: any[] = [];
    const { data: notifData } = await insforge.database
      .from("notifications")
      .select()
      .eq("user_id", "counsellor-system")
      .order("created_at", { ascending: false })
      .limit(200);
    notifications = notifData || [];

    // Build student data with full analysis
    const students = allProfiles.map((profile: any) => {
      const latestScreening = screenings.find((s: any) => s.user_id === profile.id);
      const allScreenings = screenings.filter((s: any) => s.user_id === profile.id);
      const latestMood = moods.find((m: any) => m.user_id === profile.id);
      const session = sessions.find((s: any) => s.student_id === profile.id);
      const studentFlaggedMsgs = flaggedMessages.filter((m: any) => m.sender_id === profile.id);

      // Find AI analysis notifications for this student
      const studentNotifs = notifications.filter((n: any) =>
        n.body?.includes(profile.id?.slice(0, 8)) ||
        n.link?.includes(profile.id) ||
        (session?.id && n.link?.includes(session.id))
      );

      const phq9Score = latestScreening?.score || 0;
      const assessmentType = latestScreening?.assessment_type || "none";
      let riskLevel = "Minimal";
      if (phq9Score >= 20) riskLevel = "Critical";
      else if (phq9Score >= 15) riskLevel = "High";
      else if (phq9Score >= 10) riskLevel = "Moderate";

      // Extract Q9 score from responses if available
      const responses = latestScreening?.responses;
      let q9Score = 0;
      let q9Flagged = false;
      if (Array.isArray(responses) && responses.length >= 9) {
        q9Score = responses[8] || 0;
        q9Flagged = q9Score >= 1;
      }

      // Extract NLP analysis from notifications
      const nlpNotif = studentNotifs.find((n: any) => n.title?.includes("AI Analysis") || n.title?.includes("NLP"));
      const crisisNotif = studentNotifs.find((n: any) => n.title?.includes("Crisis") || n.title?.includes("Question 9"));
      const stageNotif = studentNotifs.find((n: any) => n.title?.includes("Stage"));

      // Build risk indicators
      const riskIndicators: string[] = [];
      if (q9Flagged) riskIndicators.push(`Self-harm ideation: Q9 score ${q9Score}/3 — immediate follow-up required`);
      if (studentFlaggedMsgs.length > 0) riskIndicators.push(`${studentFlaggedMsgs.length} flagged message(s) containing crisis keywords`);
      if (crisisNotif) riskIndicators.push("Crisis detection triggered in AI chat");
      if (phq9Score >= 20) riskIndicators.push("Severe depression indicated (PHQ-9 ≥ 20)");
      else if (phq9Score >= 15) riskIndicators.push("Moderately severe depression (PHQ-9 ≥ 15)");

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
        phq9MaxScore: 27,
        assessmentType,
        severity: latestScreening?.severity || "No screening yet",
        moodScore: latestMood?.mood_score || null,
        stressLevel: latestMood?.stress_level || null,
        lastActive: session?.updated_at || latestMood?.created_at || latestScreening?.created_at || profile.created_at,
        status: session?.status || "no session",
        notes: session?.notes || "",
        aiSummary: session?.ai_summary || "",
        // Enhanced analysis data
        q9Score,
        q9Flagged,
        riskIndicators,
        flaggedMessages: studentFlaggedMsgs.slice(0, 5).map((m: any) => ({
          content: m.content,
          date: m.created_at,
        })),
        nlpAnalysis: nlpNotif?.body || null,
        crisisAlert: crisisNotif?.body || null,
        stageInfo: stageNotif?.body || null,
        totalScreenings: allScreenings.length,
        recommendation: phq9Score >= 20
          ? "Immediate professional intervention required. Contact student directly."
          : phq9Score >= 15
          ? "Schedule urgent session. Consider referral to specialist."
          : phq9Score >= 10
          ? "Monitor closely. Recommend regular check-ins and wellness resources."
          : phq9Score >= 5
          ? "Low-moderate concern. Encourage continued self-care and periodic screening."
          : "Student managing well. Continue routine check-ins.",
      };
    });

    return NextResponse.json({ students });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
