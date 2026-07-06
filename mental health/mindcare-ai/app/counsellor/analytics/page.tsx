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

  const exportReport = (type: "general" | "individual") => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      type,
      summary: {
        totalScreenings: data?.totalScreenings || 0,
        totalSessions: data?.totalSessions || 0,
        totalMessages: data?.messageActivity?.total || 0,
        highRiskAlerts: riskDistribution.find((r: any) => r.name === "Critical")?.value || 0,
      },
      riskDistribution,
      modelComparison,
      modelScoreRanges,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `selfcare-hub-${type}-report-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          <div className="h-48">
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
          <div className="h-48">
            {modelUsageDistribution.length > 0 ? (
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
          <div className="h-48">
            {modelComparison.length > 0 ? (
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-on-surface-variant uppercase">Model</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-on-surface-variant uppercase">Assessments</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-on-surface-variant uppercase">Avg Score</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-on-surface-variant uppercase">Max Score</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-on-surface-variant uppercase">Avg Severity</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-on-surface-variant uppercase">High Risk</th>
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="text-left py-2 px-3 text-xs font-semibold text-on-surface-variant uppercase">Report Type</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-on-surface-variant uppercase">Status</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-on-surface-variant uppercase">Regularity</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-on-surface-variant uppercase">Last Generated</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-on-surface-variant uppercase">Action</th>
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
