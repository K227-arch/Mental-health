"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { moodChartData, wellnessMilestones } from "../lib/data";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const moodHistory = [
  { date: "Mon", mood: 3, label: "😐" },
  { date: "Tue", mood: 4, label: "🙂" },
  { date: "Wed", mood: 2, label: "😔" },
  { date: "Thu", mood: 3, label: "😐" },
  { date: "Fri", mood: 4, label: "🙂" },
  { date: "Sat", mood: 5, label: "😊" },
  { date: "Sun", mood: 4, label: "🙂" },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"30" | "90">("30");
  const [user, setUser] = useState<{ name?: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => {
      if (!r.ok) return;
      return r.json().then((d) => {
        if (d?.user) setUser(d.user);
      });
    });
  }, []);
  const [currentMood, setCurrentMood] = useState<number | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const moods = ["😢", "😔", "😐", "🙂", "😊"];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar variant="student" />

      <div className="flex flex-1 pt-16">
        {/* Mobile sidebar backdrop */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`flex-col h-[calc(100vh-64px)] sticky top-16 w-64 shrink-0 p-3 border-r border-outline-variant bg-surface-container-low overflow-y-auto ${
          mobileSidebarOpen
            ? "fixed left-0 top-16 z-40 shadow-2xl animate-slide-in"
            : "hidden"
        } md:flex`}>
          <div className="mb-4 px-3">
            <h2 className="text-xs text-on-surface-variant uppercase tracking-wider mb-1 mt-3">Student Portal</h2>
            <p className="text-sm font-semibold text-on-surface">My Wellness</p>
          </div>
          <nav className="flex-1 flex flex-col gap-1">
            {[
              { href: "/dashboard", label: "Dashboard", icon: "dashboard", active: true },
              { href: "/screening", label: "Daily Check-in", icon: "psychology" },
              { href: "/wellness", label: "Wellness Hub", icon: "self_improvement" },
              { href: "/crisis", label: "Crisis Support", icon: "emergency", red: true },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                    : item.red
                    ? "text-error hover:bg-error-container/30"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </nav>

        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto bg-surface p-4 md:p-10">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden p-1.5 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
                  onClick={() => setMobileSidebarOpen(true)}
                  aria-label="Open sidebar"
                >
                  <span className="material-symbols-outlined">menu</span>
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-on-surface mb-1">Welcome back, {user?.name || "Student"}</h1>
                  <p className="text-on-surface-variant text-sm">Digital Twin Visualization & Longitudinal Insights</p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-secondary mr-2 animate-pulse" />
                Live Sync Active
              </span>
            </div>

            {/* Quick mood check */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">mood</span>
                How are you feeling right now?
              </h3>
              <div className="flex gap-3 justify-center md:justify-start">
                {moods.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentMood(i)}
                    className={`text-2xl md:text-3xl p-2 rounded-xl transition-all hover:scale-110 ${
                      currentMood === i
                        ? "bg-primary-container ring-2 ring-primary scale-110"
                        : "hover:bg-surface-container"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {currentMood !== null && (
                <p className="text-xs text-secondary font-medium mt-2 animate-fade-in">
                  Mood recorded ✓ — Your counselor has been updated.
                </p>
              )}
            </div>

            {/* Bento grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Digital Twin */}
              <div className="md:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col shadow-sm min-h-[380px] relative overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-on-surface">Cognitive State Twin</h3>
                    <p className="text-xs text-on-surface-variant uppercase tracking-wide mt-0.5">
                      Real-time Mood & Depression Index
                    </p>
                  </div>
                  <button className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </div>

                {/* Abstract Twin visualization */}
                <div className="flex-1 flex items-center justify-center relative">
                  <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                    <div className="w-64 h-64 rounded-full border-2 border-primary animate-ping" style={{ animationDuration: "4s" }} />
                    <div className="w-44 h-44 rounded-full border-2 border-secondary absolute animate-ping" style={{ animationDuration: "3s", animationDelay: "1s" }} />
                  </div>
                  <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-surface-tint to-primary-container shadow-md flex items-center justify-center border-4 border-surface">
                      <span className="material-symbols-outlined icon-fill text-primary text-5xl">psychology</span>
                    </div>
                    <div className="flex gap-4 text-center">
                      <div className="bg-surface border border-outline-variant rounded-xl p-3 min-w-[110px]">
                        <p className="text-xs text-on-surface-variant mb-1">Current Mood</p>
                        <p className="text-xl font-bold text-primary">Stable</p>
                      </div>
                      <div className="bg-surface border border-outline-variant rounded-xl p-3 min-w-[110px]">
                        <p className="text-xs text-on-surface-variant mb-1">Depression Index</p>
                        <p className="text-xl font-bold text-secondary">Low</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right col */}
              <div className="md:col-span-4 flex flex-col gap-4">
                {/* Insights */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col shadow-sm flex-1">
                  <h3 className="text-sm font-semibold text-on-surface flex items-center gap-1 mb-3">
                    <span className="material-symbols-outlined text-secondary text-[20px]">lightbulb</span>
                    Proactive Insights
                  </h3>
                  <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
                    AI analysis indicates a slightly elevated stress pattern over the last 48 hours. Overall resilience remains strong.
                  </p>
                  <div className="mt-auto bg-surface rounded-xl p-3 border border-outline-variant flex items-center justify-between">
                    <span className="text-xs font-semibold text-on-surface">Relapse Risk</span>
                    <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
                      Low Risk
                    </span>
                  </div>
                </div>

                {/* Secure Messaging */}
                <Link
                  href="/crisis"
                  className="bg-primary-container text-on-primary-container rounded-xl p-5 flex flex-col shadow-sm cursor-pointer hover:bg-primary-fixed transition-colors group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="material-symbols-outlined icon-fill text-primary">person</span>
                    </div>
                    <span className="material-symbols-outlined text-on-primary-container/50 group-hover:opacity-100 transition-opacity">
                      arrow_forward
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold mt-auto">Secure Messaging</h3>
                  <p className="text-xs opacity-80 mt-1">Connect with your assigned counselor.</p>
                </Link>
              </div>

              {/* Longitudinal Chart */}
              <div className="md:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-on-surface">Longitudinal Analysis</h3>
                    <p className="text-xs text-on-surface-variant">Stress Levels & Intervention Outcomes</p>
                  </div>
                  <select
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value as "30" | "90")}
                    className="bg-surface border border-outline-variant text-on-surface text-xs rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 90 Days</option>
                  </select>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={moodChartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                      <defs>
                        <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#074469" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#074469" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="interventionGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#006a64" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#006a64" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#c1c7cf" strokeOpacity={0.4} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#41474e" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#41474e" }} />
                      <Tooltip
                        contentStyle={{
                          background: "#ffffff",
                          border: "1px solid #c1c7cf",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Area
                        type="monotone"
                        dataKey="stress"
                        name="Stress Peaks"
                        stroke="#074469"
                        strokeWidth={2}
                        fill="url(#stressGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="intervention"
                        name="Interventions"
                        stroke="#006a64"
                        strokeWidth={2}
                        fill="url(#interventionGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Weekly mood */}
              <div className="md:col-span-6 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-on-surface mb-4">This Week's Mood</h3>
                <div className="flex justify-between items-end gap-2">
                  {moodHistory.map((d) => (
                    <div key={d.date} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-lg">{d.label}</span>
                      <div
                        className="w-full bg-primary/20 rounded-sm"
                        style={{ height: `${d.mood * 16}px`, background: `rgba(7,68,105,${d.mood * 0.2})` }}
                      />
                      <span className="text-xs text-on-surface-variant">{d.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestones */}
              <div className="md:col-span-6 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-on-surface mb-4">Wellness Milestones</h3>
                <div className="grid grid-cols-2 gap-3">
                  {wellnessMilestones.map((m) => (
                    <div
                      key={m.id}
                      className={`flex items-center gap-3 bg-surface p-3 rounded-xl border ${
                        m.earned ? "border-outline-variant" : "border-dashed border-outline-variant opacity-60"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${m.color}`}>
                        <span className="material-symbols-outlined icon-fill text-[18px]">{m.icon}</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-on-surface">{m.title}</p>
                        <p className="text-[10px] text-on-surface-variant">{m.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              <Link
                href="/screening"
                className="flex items-center gap-3 p-4 bg-primary text-on-primary rounded-xl shadow-sm hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined icon-fill">psychology</span>
                <div>
                  <div className="text-sm font-semibold">Start Check-in</div>
                  <div className="text-xs opacity-80">PHQ-9 Assessment</div>
                </div>
              </Link>
              <Link
                href="/wellness"
                className="flex items-center gap-3 p-4 bg-secondary-container text-on-secondary-container rounded-xl shadow-sm hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined icon-fill">self_improvement</span>
                <div>
                  <div className="text-sm font-semibold">Wellness Hub</div>
                  <div className="text-xs opacity-80">Resources & Tools</div>
                </div>
              </Link>
              <Link
                href="/crisis"
                className="flex items-center gap-3 p-4 bg-error-container text-on-error-container rounded-xl shadow-sm hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined icon-fill">emergency</span>
                <div>
                  <div className="text-sm font-semibold">Crisis Support</div>
                  <div className="text-xs opacity-80">Immediate Help</div>
                </div>
              </Link>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
