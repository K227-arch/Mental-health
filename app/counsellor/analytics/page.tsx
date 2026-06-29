"use client";

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import { moodChartData, wellnessMilestones } from "@/app/lib/data";

const responseTimeData = [
  { day: "Mon", avg: 14, target: 10 },
  { day: "Tue", avg: 11, target: 10 },
  { day: "Wed", avg: 9, target: 10 },
  { day: "Thu", avg: 16, target: 10 },
  { day: "Fri", avg: 8, target: 10 },
  { day: "Sat", avg: 12, target: 10 },
  { day: "Sun", avg: 10, target: 10 },
];

const interventionData = [
  { month: "Jan", attempted: 18, success: 14 },
  { month: "Feb", attempted: 22, success: 18 },
  { month: "Mar", attempted: 15, success: 13 },
  { month: "Apr", attempted: 20, success: 17 },
  { month: "May", attempted: 25, success: 21 },
  { month: "Jun", attempted: 19, success: 16 },
];

const riskDistribution = [
  { name: "Critical", value: 3, color: "#ba1a1a" },
  { name: "High", value: 8, color: "#006a64" },
  { name: "Moderate", value: 15, color: "#074469" },
  { name: "Minimal", value: 16, color: "#c1c7cf" },
];

const engagementData = [
  { week: "W1", sessions: 42, messages: 180 },
  { week: "W2", sessions: 48, messages: 210 },
  { week: "W3", sessions: 55, messages: 245 },
  { week: "W4", sessions: 51, messages: 230 },
  { week: "W5", sessions: 60, messages: 280 },
  { week: "W6", sessions: 58, messages: 265 },
];

const tooltipStyle = {
  contentStyle: {
    background: "#ffffff",
    border: "1px solid #c1c7cf",
    borderRadius: "8px",
    fontSize: "12px",
  },
};

export default function CounsellorAnalytics() {
  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-on-background">Student Wellness & Analytics</h1>
          <p className="text-on-surface-variant mt-1">Digital Twin Visualization & Longitudinal Insights</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            Live Sync Active
          </span>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">
        {/* Right Column */}
        <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Proactive Insights */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col shadow-sm flex-1">
            <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-secondary text-[20px]">lightbulb</span>
              Proactive Insights
            </h3>
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-sm text-on-surface-variant mb-4">
                AI analysis indicates a slightly elevated stress pattern over the last 48 hours. However, overall resilience remains strong across the student population.
              </p>
              <div className="mt-auto bg-surface rounded-lg p-3 border border-outline-variant flex items-center justify-between">
                <span className="text-xs font-medium text-on-surface">Relapse Risk Assessment</span>
                <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">Low Risk</span>
              </div>
            </div>
          </div>

          {/* Secure Messaging */}
          <div className="bg-primary-container text-on-primary-container rounded-xl p-5 flex flex-col shadow-sm cursor-pointer hover:bg-primary-fixed transition-colors group">
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-full bg-surface/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary-container icon-fill">person</span>
              </div>
              <span className="material-symbols-outlined text-on-primary-container opacity-50 group-hover:opacity-100 transition-opacity">arrow_forward</span>
            </div>
            <h3 className="text-sm font-semibold mt-auto">Secure Messaging</h3>
            <p className="text-xs opacity-80 mt-1">Connect with your assigned counselor directly.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Critical Alerts", value: "3", icon: "warning", color: "#ba1a1a", trend: "+1 since yesterday", trendIcon: "trending_up", trendColor: "text-error" },
            { label: "Pending Interventions", value: "12", icon: "pending_actions", color: "#006a64", trend: "Requires review today", trendIcon: "schedule", trendColor: "text-on-surface-variant" },
            { label: "Referral Success", value: "84%", icon: "check_circle", color: "#074469", trend: "+2% this week", trendIcon: "trending_up", trendColor: "text-secondary" },
            { label: "Avg Response Time", value: "14m", icon: "timer", color: "#2a5c82", trend: "-2m this week", trendIcon: "trending_down", trendColor: "text-secondary" },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col gap-2 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs text-on-surface-variant font-medium">{stat.label}</span>
                <span className="material-symbols-outlined icon-fill text-[22px]" style={{ color: stat.color }}>{stat.icon}</span>
              </div>
              <div className="text-3xl font-black text-on-background">{stat.value}</div>
              <div className={`text-xs flex items-center gap-1 ${stat.trendColor}`}>
                <span className="material-symbols-outlined text-[14px]">{stat.trendIcon}</span>
                {stat.trend}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="md:col-span-6 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">timer</span>
            Response Time Trend
          </h3>
          <p className="text-xs text-on-surface-variant mb-6">Average counsellor response time (target: 10 min)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#888" />
                <YAxis tick={{ fontSize: 12 }} stroke="#888" />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="avg" stroke="#006a64" strokeWidth={2} dot={{ r: 4 }} name="Avg (min)" />
                <Line type="monotone" dataKey="target" stroke="#ba1a1a" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Target (min)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-6 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            Intervention Success Rate
          </h3>
          <p className="text-xs text-on-surface-variant mb-6">Successful interventions vs total attempted</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={interventionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#888" />
                <YAxis tick={{ fontSize: 12 }} stroke="#888" />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="attempted" fill="#c7c7c7" radius={[4, 4, 0, 0]} name="Attempted" />
                <Bar dataKey="success" fill="#006a64" radius={[4, 4, 0, 0]} name="Successful" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">pie_chart</span>
            Student Risk Distribution
          </h3>
          <p className="text-xs text-on-surface-variant mb-4">Breakdown of current caseload by risk level</p>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {riskDistribution.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">trending_up</span>
            Student Engagement
          </h3>
          <p className="text-xs text-on-surface-variant mb-6">Weekly session and message activity</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#888" />
                <YAxis tick={{ fontSize: 12 }} stroke="#888" />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="sessions" stroke="#074469" fill="#074469" fillOpacity={0.1} strokeWidth={2} name="Sessions" />
                <Area type="monotone" dataKey="messages" stroke="#006a64" fill="#006a64" fillOpacity={0.1} strokeWidth={2} name="Messages" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Longitudinal Analysis - Full width */}
        <div className="md:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-sm font-semibold text-on-surface">Longitudinal Analysis</h3>
              <p className="text-xs text-on-surface-variant">Stress Levels & Intervention Outcomes (30 Days)</p>
            </div>
            <select className="bg-surface border border-outline-variant text-on-surface text-xs rounded-md px-2 py-1.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none">
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={moodChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#888" />
                <YAxis tick={{ fontSize: 12 }} stroke="#888" />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="stress" stroke="#074469" fill="#074469" fillOpacity={0.1} strokeWidth={2} name="Stress Levels" />
                <Area type="monotone" dataKey="intervention" stroke="#006a64" fill="#006a64" fillOpacity={0.1} strokeWidth={2} name="Intervention Impact" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wellness Milestones */}
        <div className="md:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-on-surface mb-4">Wellness Milestones</h3>
          <div className="flex flex-wrap gap-4">
            {wellnessMilestones.map((milestone) => (
              <div key={milestone.id} className={`flex items-center gap-3 bg-surface p-3 rounded-lg border ${milestone.earned ? 'border-outline-variant' : 'border-dashed border-outline-variant'} min-w-[200px] ${!milestone.earned ? 'opacity-60' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${milestone.color.replace('text-', '').split(' ')[0]}`}>
                  <span className="material-symbols-outlined text-[20px] icon-fill">{milestone.icon}</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-on-surface">{milestone.title}</p>
                  <p className="text-[10px] text-on-surface-variant">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Row */}
        <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Chat Sessions", value: "248", icon: "forum" },
            { label: "Crisis Interventions", value: "36", icon: "emergency" },
            { label: "Avg Session Duration", value: "18m", icon: "schedule" },
            { label: "Student Satisfaction", value: "94%", icon: "thumb_up" },
          ].map((item) => (
            <div key={item.label} className="bg-surface-container-low border border-outline-variant rounded-lg p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-higher flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[20px]">{item.icon}</span>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">{item.label}</p>
                <p className="text-lg font-bold text-on-surface">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}