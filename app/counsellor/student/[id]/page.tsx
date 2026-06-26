"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { insforge, getSeverity, generateXAI, computeTrend } from "@/lib/insforge";
import type { ScreeningResult, MoodEntry, Message, CounsellorSession } from "@/lib/insforge";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

export default function StudentAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: studentId } = use(params);
  const router = useRouter();

  const [screenings, setScreenings] = useState<ScreeningResult[]>([]);
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [session, setSession] = useState<CounsellorSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      insforge.database.from("screening_results").select().eq("user_id", studentId).order("created_at", { ascending: false }).limit(20),
      insforge.database.from("mood_entries").select().eq("user_id", studentId).order("created_at", { ascending: false }).limit(30),
      insforge.database.from("counsellor_sessions").select().eq("student_id", studentId).order("created_at", { ascending: false }).maybeSingle(),
    ]).then(([scrRes, moodRes, sessRes]) => {
      if (scrRes.data) setScreenings(scrRes.data as ScreeningResult[]);
      if (moodRes.data) setMoods(moodRes.data as MoodEntry[]);
      if (sessRes.data) {
        setSession(sessRes.data as CounsellorSession);
        // Load chat messages for this session
        insforge.database.from("messages").select().eq("session_id", (sessRes.data as CounsellorSession).id).order("created_at", { ascending: false }).limit(50)
          .then(({ data }) => { if (data) setMessages(data as Message[]); });
      }
      setLoading(false);
    });
  }, [studentId]);

  // Export this student's full report as JSON
  const exportReport = () => {
    const report = {
      student_id: studentId,
      anonymous_id: session?.student_name || studentId,
      exported_at: new Date().toISOString(),
      screenings: screenings.map(s => ({
        date: s.created_at,
        score: s.score,
        severity: s.severity,
        risk: s.risk_level,
        responses: s.responses,
        flagged_keywords: s.flagged_keywords,
      })),
      mood_history: moods.map(m => ({ date: m.created_at, score: m.mood_score, notes: m.notes })),
      session: session ? {
        status: session.status,
        risk_level: session.risk_level,
        intervention_logged: session.intervention_logged,
        notes: session.notes,
        ai_summary: session.ai_summary,
      } : null,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student-report-${studentId.slice(0, 8)}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const latestScreen = screenings[0];
  const latestSev = latestScreen ? getSeverity(latestScreen.score) : null;
  const xai = latestScreen ? generateXAI(latestScreen.responses || {}, latestScreen.score) : null;
  const trend = screenings.length > 0 ? computeTrend(screenings.map(s => s.score)) : null;
  const flaggedMessages = messages.filter(m => m.is_flagged);

  // Chart data — PHQ-9 over time
  const phqChartData = screenings.slice(0, 10).reverse().map((s, i) => ({
    date: new Date(s.created_at).toLocaleDateString("en", { month: "short", day: "numeric" }),
    score: s.score,
    risk: s.risk_level,
  }));

  // Mood chart
  const moodChartData = moods.slice(0, 14).reverse().map((m) => ({
    date: new Date(m.created_at).toLocaleDateString("en", { weekday: "short" }),
    mood: m.mood_score,
    stress: m.stress_level || 0,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/counsellor" className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-on-surface">
              {session?.student_name || studentId}
            </h1>
            <p className="text-sm text-on-surface-variant">
              Longitudinal Analytics · {screenings.length} screenings · {moods.length} mood entries
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {session && (
            <Link
              href={`/counsellor/chat?session=${session.id}&student=${studentId}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:opacity-90"
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              Open Chat
            </Link>
          )}
          <button onClick={exportReport}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-highest text-on-surface rounded-xl text-sm font-medium hover:bg-surface-variant transition-colors">
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export Report
          </button>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Latest PHQ-9", value: latestScreen?.score ?? "—", sub: latestSev?.label || "No data", color: latestSev?.color || "text-on-surface-variant" },
          { label: "Risk Level", value: session?.risk_level || "—", sub: trend ? `Trend: ${trend.label}` : "—", color: "text-primary" },
          { label: "Sessions", value: "1", sub: `Status: ${session?.status || "none"}`, color: "text-secondary" },
          { label: "Flagged Msgs", value: flaggedMessages.length, sub: "Crisis keywords", color: flaggedMessages.length > 0 ? "text-error" : "text-on-surface-variant" },
        ].map(k => (
          <div key={k.label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
            <p className="text-xs text-on-surface-variant mb-1">{k.label}</p>
            <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Trend */}
      {trend && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          trend.direction === "improving" ? "bg-secondary-container/30 border-secondary-fixed-dim" :
          trend.direction === "worsening" || trend.direction === "critical_spike" ? "bg-error-container/30 border-error-container" :
          "bg-surface-container border-outline-variant"
        }`}>
          <span className={`material-symbols-outlined text-[28px] shrink-0 ${trend.color}`}>{trend.icon}</span>
          <div>
            <p className={`font-bold ${trend.color}`}>Relapse Trend: {trend.label}</p>
            <p className="text-sm text-on-surface-variant">{trend.description}</p>
          </div>
        </div>
      )}

      {/* PHQ-9 longitudinal chart */}
      {phqChartData.length > 0 && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-on-surface mb-1">PHQ-9 Score Over Time</h3>
          <p className="text-xs text-on-surface-variant mb-4">Last {phqChartData.length} screenings</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={phqChartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="phqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#074469" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#074469" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {/* Severity reference lines */}
                <CartesianGrid strokeDasharray="3 3" stroke="#c1c7cf" strokeOpacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#41474e" }} />
                <YAxis domain={[0, 27]} tick={{ fontSize: 11, fill: "#41474e" }} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #c1c7cf", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(v) => v != null ? [`${v} (${getSeverity(Number(v)).label})`, "PHQ-9 Score"] as [string, string] : ["—", "PHQ-9 Score"] as [string, string]}
                />
                <Area type="monotone" dataKey="score" name="PHQ-9 Score" stroke="#074469" strokeWidth={2.5} fill="url(#phqGrad)" dot={{ fill: "#074469", r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Reference legend */}
          <div className="flex flex-wrap gap-3 mt-2">
            {[
              { label: "Minimal (0–4)", color: "bg-secondary" },
              { label: "Mild (5–9)", color: "bg-surface-container-highest" },
              { label: "Moderate (10–14)", color: "bg-primary-container" },
              { label: "Severe (15+)", color: "bg-error-container" },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-sm ${b.color}`} />
                <span className="text-[10px] text-on-surface-variant">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mood chart */}
      {moodChartData.length > 0 && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-on-surface mb-1">Mood & Stress Trend</h3>
          <p className="text-xs text-on-surface-variant mb-4">Last {moodChartData.length} entries</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={moodChartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="moodGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#006a64" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#006a64" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#c1c7cf" strokeOpacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#41474e" }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: "#41474e" }} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #c1c7cf", borderRadius: "8px", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Area type="monotone" dataKey="mood" name="Mood (1-5)" stroke="#006a64" strokeWidth={2} fill="url(#moodGrad2)" />
                <Area type="monotone" dataKey="stress" name="Stress (1-5)" stroke="#ba1a1a" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* XAI Panel */}
        {xai && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">psychiatry</span>
              Latest XAI Analysis
              <span className="ml-auto text-xs bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full">{xai.confidence}%</span>
            </h3>
            <p className="text-xs text-on-surface-variant mb-3 leading-relaxed">{xai.summary}</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {xai.markers.filter(m => m.score > 0).map((m, i) => (
                <div key={i} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs ${m.flag ? "bg-error-container/20 border border-error-container/50" : "bg-surface-container border border-outline-variant/30"}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
                    m.score === 1 ? "bg-surface-container-highest text-on-surface" :
                    m.score === 2 ? "bg-primary-container text-on-primary-container" :
                    "bg-error-container text-on-error-container"
                  }`}>{m.score}</span>
                  <span className="font-medium text-on-surface truncate flex-1">{m.question}</span>
                  {m.flag && <span className="material-symbols-outlined icon-fill text-error text-[14px]">flag</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flagged messages */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[18px]">flag</span>
            Flagged Messages
            {flaggedMessages.length > 0 && (
              <span className="ml-auto text-xs bg-error text-on-error px-2 py-0.5 rounded-full">{flaggedMessages.length}</span>
            )}
          </h3>
          {flaggedMessages.length === 0 ? (
            <p className="text-xs text-on-surface-variant">No crisis keywords detected in chat.</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {flaggedMessages.map(m => (
                <div key={m.id} className="bg-error-container/15 border border-error-container/40 rounded-xl p-3">
                  <p className="text-xs text-on-surface italic mb-1">&ldquo;{m.content.substring(0, 120)}{m.content.length > 120 ? "…" : ""}&rdquo;</p>
                  <p className="text-[10px] text-outline">{new Date(m.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Screening history table */}
      {screenings.length > 0 && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4">Full Screening History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-outline-variant text-on-surface-variant">
                  <th className="text-left py-2 pr-4 font-semibold">Date</th>
                  <th className="text-left py-2 pr-4 font-semibold">Score</th>
                  <th className="text-left py-2 pr-4 font-semibold">Severity</th>
                  <th className="text-left py-2 pr-4 font-semibold">Risk</th>
                  <th className="text-left py-2 font-semibold">Keywords</th>
                </tr>
              </thead>
              <tbody>
                {screenings.map(s => {
                  const sv = getSeverity(s.score);
                  return (
                    <tr key={s.id} className="border-b border-outline-variant/30 last:border-0 hover:bg-surface-container/50 transition-colors">
                      <td className="py-2.5 pr-4 text-on-surface-variant">{new Date(s.created_at).toLocaleDateString()}</td>
                      <td className={`py-2.5 pr-4 font-black text-base ${sv.color}`}>{s.score}</td>
                      <td className="py-2.5 pr-4 text-on-surface">{s.severity}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          s.risk_level === "Critical" ? "bg-error text-on-error" :
                          s.risk_level === "High" ? "bg-error-container text-on-error-container" :
                          s.risk_level === "Moderate" ? "bg-primary-container text-on-primary-container" :
                          "bg-secondary-container text-on-secondary-container"
                        }`}>{s.risk_level}</span>
                      </td>
                      <td className="py-2.5 text-error text-[10px]">
                        {s.flagged_keywords?.length ? s.flagged_keywords.join(", ") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
