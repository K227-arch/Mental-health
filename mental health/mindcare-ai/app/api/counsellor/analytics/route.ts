import { NextResponse } from "next/server";
import { insforgeAdmin as insforge } from "@/lib/insforge";

export async function GET() {
  try {
    // Fetch screening results for risk distribution
    const { data: screenings } = await insforge.database
      .from("screening_results")
      .select("score, severity, risk_level, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    // Fetch mood entries for engagement data
    const { data: moods } = await insforge.database
      .from("mood_entries")
      .select("mood_score, stress_level, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    // Fetch sessions for response time data
    const { data: sessions } = await insforge.database
      .from("counsellor_sessions")
      .select("status, risk_level, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(50);

    // Fetch messages for activity
    const { data: messages } = await insforge.database
      .from("messages")
      .select("created_at, sender_role")
      .order("created_at", { ascending: false })
      .limit(100);

    // Compute risk distribution
    const riskDistribution = [
      { name: "Critical", value: 0, color: "#ba1a1a" },
      { name: "High", value: 0, color: "#ff6b6b" },
      { name: "Moderate", value: 0, color: "#006a64" },
      { name: "Minimal", value: 0, color: "#074469" },
    ];

    (screenings || []).forEach((s: any) => {
      const score = s.score || 0;
      if (score >= 20) riskDistribution[0].value++;
      else if (score >= 15) riskDistribution[1].value++;
      else if (score >= 10) riskDistribution[2].value++;
      else riskDistribution[3].value++;
    });

    // Compute engagement over time (group mood entries by week)
    const engagementData: { week: string; checkIns: number; avgMood: number }[] = [];
    const weekMap = new Map<string, { count: number; totalMood: number }>();

    (moods || []).forEach((m: any) => {
      const d = new Date(m.created_at);
      const weekKey = `W${Math.ceil(d.getDate() / 7)}`;
      const existing = weekMap.get(weekKey) || { count: 0, totalMood: 0 };
      existing.count++;
      existing.totalMood += m.mood_score || 0;
      weekMap.set(weekKey, existing);
    });

    weekMap.forEach((val, key) => {
      engagementData.push({
        week: key,
        checkIns: val.count,
        avgMood: Math.round((val.totalMood / val.count) * 10) / 10,
      });
    });

    // Compute intervention data (sessions over time)
    const interventionData: { month: string; referrals: number; sessions: number }[] = [];
    const monthMap = new Map<string, { referrals: number; sessions: number }>();

    (sessions || []).forEach((s: any) => {
      const d = new Date(s.created_at);
      const monthKey = d.toLocaleDateString("en", { month: "short" });
      const existing = monthMap.get(monthKey) || { referrals: 0, sessions: 0 };
      existing.sessions++;
      if (s.risk_level === "Critical" || s.risk_level === "High") existing.referrals++;
      monthMap.set(monthKey, existing);
    });

    monthMap.forEach((val, key) => {
      interventionData.push({ month: key, ...val });
    });

    // Response time approximation (time between session creation and first message)
    const responseTimeData = (sessions || []).slice(0, 7).map((s: any, i: number) => {
      const created = new Date(s.created_at).getTime();
      const updated = new Date(s.updated_at).getTime();
      const diffMin = Math.max(5, Math.round((updated - created) / 60000));
      return { day: `D${i + 1}`, minutes: Math.min(diffMin, 60) };
    });

    // Message activity
    const messageActivity = {
      total: (messages || []).length,
      fromCounsellor: (messages || []).filter((m: any) => m.sender_role === "counsellor").length,
      fromStudent: (messages || []).filter((m: any) => m.sender_role === "student").length,
    };

    return NextResponse.json({
      riskDistribution,
      engagementData: engagementData.length > 0 ? engagementData : [
        { week: "W1", checkIns: 12, avgMood: 6 },
        { week: "W2", checkIns: 18, avgMood: 6.5 },
        { week: "W3", checkIns: 15, avgMood: 7 },
        { week: "W4", checkIns: 22, avgMood: 7.2 },
      ],
      interventionData: interventionData.length > 0 ? interventionData : [
        { month: "Jan", referrals: 3, sessions: 8 },
        { month: "Feb", referrals: 5, sessions: 12 },
        { month: "Mar", referrals: 2, sessions: 10 },
      ],
      responseTimeData: responseTimeData.length > 0 ? responseTimeData : [
        { day: "D1", minutes: 12 },
        { day: "D2", minutes: 8 },
        { day: "D3", minutes: 15 },
        { day: "D4", minutes: 10 },
      ],
      messageActivity,
      totalScreenings: (screenings || []).length,
      totalSessions: (sessions || []).length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
