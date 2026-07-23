"use client";
import { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function AdminAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/counsellor/analytics").then(r => r.ok ? r.json() : null).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const exportReport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `admin-analytics-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)] text-on-surface-variant">
      <span className="material-symbols-outlined animate-spin text-[24px] mr-2">progress_activity</span> Loading analytics...
    </div>
  );

  const riskDistribution = data?.riskDistribution || [];
  const interventionData = data?.interventionData || [];
  const engagementData = data?.engagementData || [];
  const responseTimeData = data?.responseTimeData || [];
  const modelComparison = data?.modelComparison || [];

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Platform Analytics</h1>
          <p className="text-on-surface-variant mt-1">Full system analytics and performance metrics.</p>
        </div>
        <button onClick={exportReport} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 shadow-sm">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Screenings", value: data?.totalScreenings || 0, color: "text-primary" },
          { label: "Active Sessions", value: data?.totalSessions || 0, color: "text-secondary" },
          { label: "Messages Sent", value: data?.messageActivity?.total || 0, color: "text-on-surface" },
          { label: "Critical Alerts", value: riskDistribution.find((r: any) => r.name === "Critical")?.value || 0, color: "text-error" },
        ].map(s => (
          <div key={s.label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
            <div className="text-xs text-on-surface-variant font-medium mb-1">{s.label}</div>
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-error text-[18px]">warning</span>Risk Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={riskDistribution} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {riskDistribution.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary text-[18px]">monitoring</span>Student Engagement</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementData}><CartesianGrid strokeDasharray="3 3" stroke="#c1c7cf40" /><XAxis dataKey="week" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip />
                <Area type="monotone" dataKey="checkIns" stroke="#c2185b" fill="#c2185b" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-[18px]">medical_services</span>Interventions & Referrals</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={interventionData}><CartesianGrid strokeDasharray="3 3" stroke="#c1c7cf40" /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend />
                <Bar dataKey="sessions" fill="#c2185b" radius={[4,4,0,0]} /><Bar dataKey="referrals" fill="#006a64" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary text-[18px]">timer</span>Counsellor Response Time</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseTimeData}><CartesianGrid strokeDasharray="3 3" stroke="#c1c7cf40" /><XAxis dataKey="day" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip />
                <Line type="monotone" dataKey="minutes" stroke="#c2185b" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Model comparison */}
      {modelComparison.length > 0 && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary text-[18px]">table_chart</span>Assessment Model Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-outline-variant">
                {["Model","Assessments","Avg Score","Max Score","Avg Severity %","High Risk"].map(h => <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-on-surface-variant uppercase">{h}</th>)}
              </tr></thead>
              <tbody>{modelComparison.map((m: any) => (
                <tr key={m.model} className="border-b border-outline-variant/30 hover:bg-surface-container-low">
                  <td className="py-3 px-3 font-semibold">{m.model}</td>
                  <td className="py-3 px-3 text-center">{m.assessments}</td>
                  <td className="py-3 px-3 text-center">{m.avgScore}</td>
                  <td className="py-3 px-3 text-center text-on-surface-variant">{m.maxScore}</td>
                  <td className="py-3 px-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${m.avgPct >= 55 ? "bg-error-container text-on-error-container" : m.avgPct >= 35 ? "bg-primary-container text-on-primary-container" : "bg-secondary-container text-on-secondary-container"}`}>{m.avgPct}%</span></td>
                  <td className="py-3 px-3 text-center text-error font-semibold">{m.highRisk}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
