"use client";

import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import { useTranslation } from "../../lib/i18n";

export default function CounsellorAnalytics() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/counsellor/analytics")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-[24px] mr-2">progress_activity</span>
        {t("counsellor.analytics.loading")}
      </div>
    );
  }

  const responseTimeData = data?.responseTimeData || [];
  const interventionData = data?.interventionData || [];
  const riskDistribution = data?.riskDistribution || [];
  const engagementData = data?.engagementData || [];
  const modelUsageDistribution = data?.modelUsageDistribution || [];
  const modelComparison = data?.modelComparison || [];
  const modelScoreRanges = data?.modelScoreRanges || [];

  const exportReport = async (type: "general" | "individual") => {
    // Dynamically import jsPDF so it only loads when the button is clicked.
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const date = new Date();
    const dateStr = date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    const timeStr = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const pageW = doc.internal.pageSize.getWidth();
    const marginL = 18;
    const marginR = 18;
    const contentW = pageW - marginL - marginR;

    // ── Helpers ───────────────────────────────────────────────────────────────
    const addPage = () => {
      doc.addPage();
      return 20; // reset y
    };

    const checkPage = (y: number, needed = 20): number => {
      if (y + needed > 275) return addPage();
      return y;
    };

    const drawLine = (y: number, color = "#e2e8f0") => {
      doc.setDrawColor(color);
      doc.setLineWidth(0.3);
      doc.line(marginL, y, pageW - marginR, y);
    };

    const text = (str: string, x: number, y: number, opts?: any) => {
      doc.text(str, x, y, opts);
      return y;
    };

    // ── Cover Page ────────────────────────────────────────────────────────────
    // Header band
    doc.setFillColor("#c2185b");
    doc.rect(0, 0, pageW, 52, "F");

    doc.setTextColor("#ffffff");
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    text("Selfcare Hub", marginL, 22);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    text("Student Mental Health Platform", marginL, 31);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    const title = type === "general"
      ? "General Analytics Report"
      : "Individual Student Report";
    text(title, marginL, 44);

    // Meta block
    doc.setTextColor("#1e293b");
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    let y = 68;
    text(`Generated:  ${dateStr} at ${timeStr}`, marginL, y); y += 6;
    text(`Report Type:  ${type === "general" ? "Platform-wide analytics summary" : "Individual student data"}`, marginL, y); y += 6;
    text(`Institution:  University Wellness Programme`, marginL, y); y += 6;
    text(`Prepared for:  Counsellor / Mental Health Team`, marginL, y); y += 10;
    drawLine(y); y += 8;

    // ── Introduction ─────────────────────────────────────────────────────────
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#c2185b");
    text("Introduction", marginL, y); y += 7;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#334155");
    const intro = [
      "This report presents an evidence-based summary of student mental health activity on the Selfcare Hub platform.",
      "It is intended for use by mental health counsellors and institutional administrators to guide data-informed",
      "interventions, resource allocation, and student support strategies.",
      "",
      "All data is aggregated and anonymised in accordance with confidentiality protocols. Individual student",
      "identifiers are not disclosed in general reports.",
    ];
    intro.forEach((line) => { text(line, marginL, y); y += 5; });
    y += 4;

    // ── Summary Metrics ───────────────────────────────────────────────────────
    y = checkPage(y, 40);
    drawLine(y); y += 8;

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#c2185b");
    text("1. Summary Metrics", marginL, y); y += 7;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#334155");
    text("The following key performance indicators were recorded during the reporting period:", marginL, y); y += 8;

    const metrics = [
      ["Total Screenings Completed", String(data?.totalScreenings || 0), "Total number of PHQ-9 / GAD-7 assessments submitted by students."],
      ["Active Counselling Sessions", String(data?.totalSessions || 0), "Number of open or in-progress student-counsellor sessions."],
      ["Total Messages Exchanged", String(data?.messageActivity?.total || 0), "Cumulative secure messages sent across all sessions."],
      ["High-Risk (Critical) Alerts", String(riskDistribution.find((r: any) => r.name === "Critical")?.value || 0), "Students flagged as critical risk requiring immediate intervention."],
      ["High-Risk (High) Cases", String(riskDistribution.find((r: any) => r.name === "High")?.value || 0), "Students scoring in the high-risk band — close monitoring recommended."],
    ];

    metrics.forEach(([label, value, desc]) => {
      y = checkPage(y, 14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor("#1e293b");
      text(`• ${label}: `, marginL + 2, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor("#c2185b");
      text(value, marginL + 72, y);
      y += 4.5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor("#64748b");
      doc.setFontSize(8);
      text(desc, marginL + 6, y);
      doc.setFontSize(9);
      doc.setTextColor("#334155");
      y += 6;
    });

    // ── Risk Distribution ─────────────────────────────────────────────────────
    y = checkPage(y, 50);
    drawLine(y); y += 8;

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#c2185b");
    text("2. Risk Level Distribution", marginL, y); y += 7;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#334155");
    text("Breakdown of students by assessed risk level across all screenings completed:", marginL, y); y += 8;

    if (riskDistribution.length > 0) {
      const colW = contentW / 3;
      // Header row
      doc.setFillColor("#f1f5f9");
      doc.rect(marginL, y - 4, contentW, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setTextColor("#1e293b");
      doc.setFontSize(8.5);
      text("Risk Level", marginL + 2, y); text("Count", marginL + colW, y); text("% of Total", marginL + colW * 2, y);
      y += 5;
      drawLine(y, "#cbd5e1"); y += 3;

      const total = riskDistribution.reduce((s: number, r: any) => s + (r.value || 0), 0);
      const riskColors: Record<string, string> = { Critical: "#dc2626", High: "#ea580c", Moderate: "#d97706", Minimal: "#16a34a" };

      riskDistribution.forEach((r: any) => {
        y = checkPage(y, 8);
        const pct = total > 0 ? ((r.value / total) * 100).toFixed(1) : "0.0";
        const col = riskColors[r.name] || "#334155";
        doc.setFont("helvetica", "normal"); doc.setTextColor(col); doc.setFontSize(9);
        text(r.name || "—", marginL + 2, y);
        doc.setTextColor("#334155");
        text(String(r.value || 0), marginL + colW, y);
        text(`${pct}%`, marginL + colW * 2, y);
        y += 6.5;
      });

      y += 4;
      doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.setTextColor("#64748b");
      text("Note: Percentages are based on total screenings. Critical cases require immediate counsellor follow-up.", marginL, y);
      y += 8;
    } else {
      doc.setTextColor("#94a3b8"); text("No risk distribution data available for this period.", marginL, y); y += 10;
    }

    // ── Model Performance ─────────────────────────────────────────────────────
    y = checkPage(y, 50);
    drawLine(y); y += 8;

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#c2185b");
    text("3. Assessment Model Performance", marginL, y); y += 7;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#334155");
    text("Summary of AI screening models used, their assessment volumes and average severity scores:", marginL, y); y += 8;

    if (modelComparison.length > 0) {
      const cols = [0, 40, 70, 100, 135];
      doc.setFillColor("#f1f5f9");
      doc.rect(marginL, y - 4, contentW, 8, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor("#1e293b");
      ["Model", "Assessments", "Avg Score", "High Risk", "Avg Severity %"].forEach((h, i) => {
        text(h, marginL + cols[i], y);
      });
      y += 5; drawLine(y, "#cbd5e1"); y += 3;

      modelComparison.forEach((m: any) => {
        y = checkPage(y, 8);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor("#334155");
        text(String(m.model || "—").slice(0, 14), marginL + cols[0], y);
        text(String(m.assessments || 0), marginL + cols[1], y);
        text(String(m.avgScore ?? "—"), marginL + cols[2], y);
        text(String(m.highRisk || 0), marginL + cols[3], y);
        text(`${m.avgSeverityPct ?? "—"}%`, marginL + cols[4], y);
        y += 6.5;
      });
      y += 4;
    } else {
      doc.setTextColor("#94a3b8"); text("No model performance data available.", marginL, y); y += 10;
    }

    // ── Engagement ────────────────────────────────────────────────────────────
    if (data?.messageActivity) {
      y = checkPage(y, 40);
      drawLine(y); y += 8;
      doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor("#c2185b");
      text("4. Platform Engagement", marginL, y); y += 7;
      doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor("#334155");

      const engage = [
        ["Total Messages", String(data.messageActivity.total || 0)],
        ["Student Messages", String(data.messageActivity.student || 0)],
        ["Counsellor Messages", String(data.messageActivity.counsellor || 0)],
        ["Avg Messages / Session", String(data.messageActivity.avgPerSession || 0)],
      ];
      engage.forEach(([label, val]) => {
        y = checkPage(y, 7);
        doc.setFont("helvetica", "bold"); doc.setTextColor("#1e293b");
        text(`${label}: `, marginL + 2, y);
        doc.setFont("helvetica", "normal"); doc.setTextColor("#c2185b");
        text(val, marginL + 70, y);
        doc.setTextColor("#334155");
        y += 6;
      });
      y += 4;
    }

    // ── Recommendations ───────────────────────────────────────────────────────
    y = checkPage(y, 60);
    drawLine(y); y += 8;
    doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor("#c2185b");
    text("5. Recommendations", marginL, y); y += 7;
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor("#334155");

    const criticalCount = riskDistribution.find((r: any) => r.name === "Critical")?.value || 0;
    const highCount = riskDistribution.find((r: any) => r.name === "High")?.value || 0;
    const recs: string[] = [];

    if (criticalCount > 0)
      recs.push(`${criticalCount} student(s) are in the Critical risk band. Immediate outreach and crisis assessment is strongly recommended.`);
    if (highCount > 0)
      recs.push(`${highCount} student(s) are in the High risk band. Schedule follow-up sessions within 48 hours.`);
    if ((data?.totalSessions || 0) === 0)
      recs.push("No active counselling sessions detected. Consider proactively reaching out to at-risk students.");
    recs.push("Review PHQ-9 scores alongside NLP sentiment data for a more holistic risk picture.");
    recs.push("Ensure all Critical and High-risk students have an assigned counsellor and a safety plan in place.");
    recs.push("Monitor engagement trends monthly and adjust resource allocation accordingly.");

    recs.forEach((rec, i) => {
      y = checkPage(y, 14);
      const lines = doc.splitTextToSize(`${i + 1}. ${rec}`, contentW - 4);
      doc.text(lines, marginL + 2, y);
      y += lines.length * 5 + 2;
    });

    // ── Footer ────────────────────────────────────────────────────────────────
    const totalPages = (doc.internal as any).getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor("#94a3b8");
      drawLine(284);
      text("Selfcare Hub  •  Confidential — For authorised counselling staff only  •  Do not distribute", marginL, 289);
      text(`Page ${p} of ${totalPages}`, pageW - marginR - 18, 289);
    }

    // ── Save ──────────────────────────────────────────────────────────────────
    const filename = `selfcare-hub-${type}-report-${date.toISOString().split("T")[0]}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">{t("counsellor.analytics.title")}</h1>
          <p className="text-on-surface-variant mt-1">{t("counsellor.analytics.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportReport("general")}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export General Report
          </button>
          <button
            onClick={() => exportReport("individual")}
            className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant bg-surface text-on-surface rounded-lg text-sm font-medium hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
            Student Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <div className="text-xs text-on-surface-variant font-medium mb-1">Total Screenings</div>
          <div className="text-3xl font-black text-primary">{data?.totalScreenings || 0}</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <div className="text-xs text-on-surface-variant font-medium mb-1">Active Sessions</div>
          <div className="text-3xl font-black text-secondary">{data?.totalSessions || 0}</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <div className="text-xs text-on-surface-variant font-medium mb-1">Messages Sent</div>
          <div className="text-3xl font-black text-on-surface">{data?.messageActivity?.total || 0}</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <div className="text-xs text-on-surface-variant font-medium mb-1">High-Risk Alerts</div>
          <div className="text-3xl font-black text-error">
            {riskDistribution.find((r: any) => r.name === "Critical")?.value || 0}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">timer</span>
            Response Time (minutes)
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c1c7cf40" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#72787f" />
                <YAxis tick={{ fontSize: 11 }} stroke="#72787f" />
                <Tooltip />
                <Line type="monotone" dataKey="minutes" stroke="#c2185b" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[18px]">warning</span>
            Risk Distribution
          </h3>
          <div className="h-48 overflow-x-auto">
            <div className="h-full min-w-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskDistribution} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {riskDistribution.map((entry: any, index: number) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Interventions */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]">medical_services</span>
            Interventions & Referrals
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={interventionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c1c7cf40" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#72787f" />
                <YAxis tick={{ fontSize: 11 }} stroke="#72787f" />
                <Tooltip />
                <Legend />
                <Bar dataKey="sessions" fill="#c2185b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="referrals" fill="#006a64" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">monitoring</span>
            Student Engagement
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c1c7cf40" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#72787f" />
                <YAxis tick={{ fontSize: 11 }} stroke="#72787f" />
                <Tooltip />
                <Area type="monotone" dataKey="checkIns" stroke="#c2185b" fill="#c2185b" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="avgMood" stroke="#006a64" fill="#006a64" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Model Analytics Section */}
      <div>
        <h2 className="text-xl font-bold text-on-surface mb-2">Assessment Models</h2>
        <p className="text-on-surface-variant text-sm mb-6">Comparing performance and usage across all screening models.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Usage Distribution */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">donut_large</span>
            Model Usage Distribution
          </h3>
          <div className="h-48 overflow-x-auto">
            {modelUsageDistribution.length > 0 ? (
              <div className="h-full min-w-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={modelUsageDistribution} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {modelUsageDistribution.map((entry: any, index: number) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-on-surface-variant text-sm">No assessment data yet</div>
            )}
          </div>
        </div>

        {/* Model Comparison - Avg Score % */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]">compare</span>
            Average Severity (% of max score)
          </h3>
          <div className="h-48">
            {modelComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#c1c7cf40" />
                  <XAxis dataKey="model" tick={{ fontSize: 10 }} stroke="#72787f" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#72787f" unit="%" />
                  <Tooltip formatter={(value: any) => `${value}%`} />
                  <Bar dataKey="avgPct" fill="#c2185b" radius={[4, 4, 0, 0]} name="Avg Severity %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-on-surface-variant text-sm">No assessment data yet</div>
            )}
          </div>
        </div>

        {/* Score Range Distribution per Model */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">stacked_bar_chart</span>
            Risk Level Distribution by Model
          </h3>
          <div className="h-48">
            {modelScoreRanges.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelScoreRanges}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#c1c7cf40" />
                  <XAxis dataKey="model" tick={{ fontSize: 10 }} stroke="#72787f" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#72787f" />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="low" stackId="a" fill="#006a64" name="Low Risk" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="moderate" stackId="a" fill="#316289" name="Moderate" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="high" stackId="a" fill="#ba1a1a" name="High Risk" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-on-surface-variant text-sm">No assessment data yet</div>
            )}
          </div>
        </div>

        {/* Model Assessments Count */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]">leaderboard</span>
            Assessments per Model
          </h3>
          <div className="h-48 overflow-x-auto">
            {modelComparison.length > 0 ? (
              <div className="h-full min-w-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={modelComparison} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#c1c7cf40" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#72787f" />
                    <YAxis dataKey="model" type="category" tick={{ fontSize: 10 }} stroke="#72787f" width={60} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="assessments" fill="#006a64" name="Total" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="highRisk" fill="#ba1a1a" name="High Risk" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-on-surface-variant text-sm">No assessment data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Model Summary Table */}
      {modelComparison.length > 0 && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">table_chart</span>
            Model Performance Summary
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-on-surface-variant uppercase whitespace-nowrap">Model</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-on-surface-variant uppercase whitespace-nowrap">Assessments</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-on-surface-variant uppercase whitespace-nowrap">Avg Score</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-on-surface-variant uppercase whitespace-nowrap">Max Score</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-on-surface-variant uppercase whitespace-nowrap">Avg Severity</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-on-surface-variant uppercase whitespace-nowrap">High Risk</th>
                </tr>
              </thead>
              <tbody>
                {modelComparison.map((m: any) => (
                  <tr key={m.model} className="border-b border-outline-variant/30 hover:bg-surface-container-low">
                    <td className="py-3 px-3 font-semibold text-on-surface">{m.model}</td>
                    <td className="py-3 px-3 text-center text-on-surface">{m.assessments}</td>
                    <td className="py-3 px-3 text-center text-on-surface">{m.avgScore}</td>
                    <td className="py-3 px-3 text-center text-on-surface-variant">{m.maxScore}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        m.avgPct >= 55 ? "bg-error-container text-on-error-container" :
                        m.avgPct >= 35 ? "bg-primary-container text-on-primary-container" :
                        "bg-secondary-container text-on-secondary-container"
                      }`}>
                        {m.avgPct}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-error font-semibold">{m.highRisk}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports Section */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">description</span>
          Reports & Status
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="text-left py-2 px-3 text-xs font-semibold text-on-surface-variant uppercase whitespace-nowrap">Report Type</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-on-surface-variant uppercase whitespace-nowrap">Status</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-on-surface-variant uppercase whitespace-nowrap">Regularity</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-on-surface-variant uppercase whitespace-nowrap">Last Generated</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-on-surface-variant uppercase whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: "General Analytics Report", status: "Active", regularity: "Weekly", last: "July 1, 2026" },
                { type: "Individual Student Reports", status: "Active", regularity: "On Demand", last: "July 3, 2026" },
                { type: "Risk Assessment Summary", status: "Active", regularity: "Daily", last: "Today" },
                { type: "Model Performance Report", status: "Active", regularity: "Monthly", last: "June 30, 2026" },
                { type: "Engagement & Retention", status: "Scheduled", regularity: "Bi-weekly", last: "June 28, 2026" },
              ].map((report) => (
                <tr key={report.type} className="border-b border-outline-variant/30 hover:bg-surface-container-low">
                  <td className="py-3 px-3 font-medium text-on-surface">{report.type}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      report.status === "Active" ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-high text-on-surface-variant"
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center text-on-surface-variant text-xs">{report.regularity}</td>
                  <td className="py-3 px-3 text-center text-on-surface-variant text-xs">{report.last}</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => exportReport("general")}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 ml-auto"
                    >
                      <span className="material-symbols-outlined text-[14px]">download</span>
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
