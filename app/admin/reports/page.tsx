"use client";
import { useState, useEffect } from "react";

export default function AdminReports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/counsellor/analytics").then(r => r.ok ? r.json() : null).then(d => { setData(d); setLoading(false); });
  }, []);

  const generateReport = async (type: string) => {
    setGenerating(type);
    await new Promise(r => setTimeout(r, 800));
    const reportData = { generatedAt: new Date().toISOString(), type, platform: "Selfcare Hub", data };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `${type.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    setGenerating(null);
  };

  const reports = [
    { id: "general", type: "General Analytics Report", desc: "Platform-wide summary: screenings, sessions, risk distribution, engagement.", status: "Active", regularity: "Weekly", last: "July 1, 2026", icon: "monitoring" },
    { id: "students", type: "Individual Student Reports", desc: "Per-student screening history, risk scores, and counsellor notes.", status: "Active", regularity: "On Demand", last: "July 3, 2026", icon: "groups" },
    { id: "risk", type: "Risk Assessment Summary", desc: "Critical and high-risk students flagged by AI modules.", status: "Active", regularity: "Daily", last: "Today", icon: "warning" },
    { id: "model", type: "Model Performance Report", desc: "PHQ-9, GAD-7, WHO-5, PSS-10, PC-PTSD-5 comparison and accuracy.", status: "Active", regularity: "Monthly", last: "June 30, 2026", icon: "psychology" },
    { id: "engagement", type: "Engagement & Retention", desc: "Student check-in streaks, session duration, drop-off analysis.", status: "Scheduled", regularity: "Bi-weekly", last: "June 28, 2026", icon: "trending_up" },
    { id: "counsellor", type: "Counsellor Performance", desc: "Response times, caseload distribution, intervention outcomes.", status: "Active", regularity: "Monthly", last: "July 1, 2026", icon: "support_agent" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Reports</h1>
          <p className="text-on-surface-variant mt-1">Generate and download platform reports.</p>
        </div>
        <button onClick={() => generateReport("Full Platform Export")} disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 shadow-sm disabled:opacity-50">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export All Data
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Screenings", value: data?.totalScreenings || 0 },
          { label: "Active Sessions", value: data?.totalSessions || 0 },
          { label: "Messages", value: data?.messageActivity?.total || 0 },
          { label: "Reports Available", value: reports.length },
        ].map(s => (
          <div key={s.label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm text-center">
            <p className="text-2xl font-black text-primary mb-1">{s.value}</p>
            <p className="text-xs text-on-surface-variant">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => (
          <div key={r.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[20px]">{r.icon}</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase shrink-0 ${r.status === "Active" ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-high text-on-surface-variant"}`}>
                {r.status}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-on-surface mb-1">{r.type}</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">{r.desc}</p>
            </div>
            <div className="flex items-center justify-between text-xs text-on-surface-variant mt-auto">
              <span>{r.regularity}</span>
              <span>Last: {r.last}</span>
            </div>
            <button onClick={() => generateReport(r.type)} disabled={generating === r.type}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
              <span className="material-symbols-outlined text-[16px]">{generating === r.type ? "progress_activity" : "download"}</span>
              {generating === r.type ? "Generating..." : "Download Report"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
