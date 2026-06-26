"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { insforge, getSeverity } from "@/lib/insforge";
import type { ScreeningResult, CounsellorSession } from "@/lib/insforge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#ba1a1a", "#006a64", "#074469", "#40413e"];

export default function AnalyticsPage() {
  const [sessions, setSessions] = useState<CounsellorSession[]>([]);
  const [screenings, setScreenings] = useState<ScreeningResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");

  useEffect(() => {
    const from = new Date();
    from.setDate(from.getDate() - parseInt(timeRange));

    Promise.all([
      insforge.database.from("counsellor_sessions").select().order("created_at", { ascending: false }),
      insforge.database.from("screening_results").select().order("created_at", { ascending: false }),
    ]).then(([sessRes, screenRes]) => {
      if (sessRes.data) setSessions(sessRes.data as CounsellorSession[]);
      if (screenRes.data) setScreenings(screenRes.data as ScreeningResult[]);
      setLoading(false);
    });
  }, [timeRange]);

  // Compute stats
  const riskCounts = { Critical: 0, High: 0, Moderate: 0, Minimal: 0 };
  sessions.forEach(s => {
    const r = (s.risk_level || "Minimal") as keyof typeof riskCounts;
    if (r in riskCounts) riskCounts[r]++;
  });

  const pieData = Object.entries(riskCounts).map(([name, value]) => ({ name, value }));

  const avgScore = screenings.length > 0
    ? (screenings.reduce((a, s) => a + s.score, 0) / screenings.length).toFixed(1)
    : "—";

  // Group screenings by day
  const dayMap: Record<string, number[]> = {};
  screenings.slice(0, 30).forEach(s => {
    const day = new Date(s.created_at).toLocaleDateString("en", { month: "short", day: "numeric" });
    if (!dayMap[day]) dayMap[day] = [];
    dayMap[day].push(s.score);
  });
  const trendData = Object.entries(dayMap).slice(-14).map(([day, scores]) => ({
    day,
    avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
    count: scores.length,
  }));

  // Severity distribution
  const sevDist: Record<string, number> = {};
  screenings.forEach(s => {
    sevDist[s.severity] = (sevDist[s.severity] || 0) + 1;
  });
  const sevData = Object.entries(sevDist).map(([name, value]) => ({ name, value }));

  const interventionRate = sessions.length > 0
    ? ((sessions.filter(s => s.intervention_logged).length / sessions.length) * 100).toFixed(0)
    : "0";

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-background">Analytics & Insights</h1>
          <p className="text-on-surface-variant mt-1">Real-time population wellness data</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-secondary mr-2 animate-pulse" />
            Live Data
          </span>
          <select value={timeRange} onChange={e => setTimeRange(e.target.value)}
            className="bg-surface border border-outline-variant text-on-surface text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary">
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Active Sessions", value: sessions.filter(s => s.status === "active").length, icon: "group", color: "text-primary" },
              { label: "Avg PHQ-9 Score", value: avgScore, icon: "monitor_heart", color: "text-secondary" },
              { label: "Critical Risk Cases", value: riskCounts.Critical, icon: "warning", color: "text-error" },
              { label: "Intervention Rate", value: `${interventionRate}%`, icon: "task_alt", color: "text-secondary" },
            ].map(kpi => (
              <div key={kpi.label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-on-surface-variant">{kpi.label}</span>
                  <span className={`material-symbols-outlined icon-fill text-[20px] ${kpi.color}`}>{kpi.icon}</span>
                </div>
                <div className={`text-3xl font-black ${kpi.color}`}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Trend chart */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-on-surface mb-1">PHQ-9 Score Trend</h3>
            <p className="text-xs text-on-surface-variant mb-4">Average daily PHQ-9 scores across all students</p>
            {trendData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <defs>
                      <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#074469" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#074469" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#c1c7cf" strokeOpacity={0.4} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#41474e" }} />
                    <YAxis domain={[0, 27]} tick={{ fontSize: 11, fill: "#41474e" }} />
                    <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #c1c7cf", borderRadius: "8px", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="avg" name="Avg PHQ-9" stroke="#074469" strokeWidth={2} fill="url(#avgGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-on-surface-variant text-sm">No data yet</div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Risk distribution pie */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-on-surface mb-1">Risk Level Distribution</h3>
              <p className="text-xs text-on-surface-variant mb-4">Current session risk levels</p>
              {sessions.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-on-surface-variant text-sm">No sessions yet</div>
              )}
            </div>

            {/* Severity distribution bar */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-on-surface mb-1">Severity Distribution</h3>
              <p className="text-xs text-on-surface-variant mb-4">PHQ-9 severity across all screenings</p>
              {sevData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sevData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#c1c7cf" strokeOpacity={0.4} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#41474e" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#41474e" }} />
                      <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #c1c7cf", borderRadius: "8px", fontSize: "12px" }} />
                      <Bar dataKey="value" name="Count" fill="#074469" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-on-surface-variant text-sm">No screenings yet</div>
              )}
            </div>
          </div>

          {/* Recent high-risk screenings — clickable rows linking to student page */}
          {screenings.filter(s => s.score >= 10).length > 0 && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-on-surface">High-Risk Screenings</h3>
                <button
                  onClick={() => {
                    const report = {
                      exported_at: new Date().toISOString(),
                      time_range: `${timeRange} days`,
                      summary: {
                        total_sessions: sessions.length,
                        avg_phq9: avgScore,
                        critical: riskCounts.Critical,
                        high: riskCounts.High,
                        intervention_rate: `${interventionRate}%`,
                      },
                      high_risk_screenings: screenings.filter(s => s.score >= 10).map(s => ({
                        user_id: s.user_id,
                        score: s.score,
                        severity: s.severity,
                        risk: s.risk_level,
                        date: s.created_at,
                        flagged: s.flagged_keywords,
                      })),
                    };
                    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `analytics-report-${new Date().toISOString().split("T")[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-highest text-on-surface rounded-lg text-xs font-medium hover:bg-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Export Report
                </button>
              </div>
              <div className="space-y-2">
                {screenings.filter(s => s.score >= 10).slice(0, 8).map(s => {
                  const sev = getSeverity(s.score);
                  return (
                    <Link
                      key={s.id}
                      href={`/counsellor/student/${s.user_id}`}
                      className="flex items-center justify-between py-2.5 px-3 border border-outline-variant rounded-xl hover:bg-surface-container hover:border-primary/30 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-black ${sev.color}`}>{s.score}</span>
                        <div>
                          <p className={`text-sm font-semibold ${sev.color}`}>{sev.label}</p>
                          <p className="text-xs text-on-surface-variant font-mono">{s.user_id.slice(0, 12)}…</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-xs text-on-surface-variant">{new Date(s.created_at).toLocaleDateString()}</p>
                          {s.flagged_keywords && s.flagged_keywords.length > 0 && (
                            <span className="text-[10px] text-error font-medium flex items-center gap-1 justify-end mt-0.5">
                              <span className="material-symbols-outlined text-[12px]">flag</span>
                              {s.flagged_keywords.slice(0, 2).join(", ")}
                            </span>
                          )}
                        </div>
                        <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40 group-hover:text-primary transition-colors">arrow_forward</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
