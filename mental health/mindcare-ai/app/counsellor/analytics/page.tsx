"use client";

import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";

export default function CounsellorAnalytics() {
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
        Loading analytics...
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

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-on-surface">Analytics & Insights</h1>
        <p className="text-on-surface-variant mt-1">Real-time data from screening results, sessions, and student engagement.</p>
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
                <Line type="monotone" dataKey="minutes" stroke="#074469" strokeWidth={2} dot={{ r: 4 }} />
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
                <Bar dataKey="sessions" fill="#074469" radius={[4, 4, 0, 0]} />
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
                <Area type="monotone" dataKey="checkIns" stroke="#074469" fill="#074469" fillOpacity={0.15} strokeWidth={2} />
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
                  <Bar dataKey="avgPct" fill="#074469" radius={[4, 4, 0, 0]} name="Avg Severity %" />
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
    </div>
  );
}
