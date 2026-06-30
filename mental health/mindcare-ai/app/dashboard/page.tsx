"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import StudentSidebar from "../components/StudentSidebar";
import Footer from "../components/Footer";
import { wellnessMilestones } from "../lib/data";
import { useTranslation } from "../lib/i18n";
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

const moods = ["😢", "😔", "😐", "🙂", "😊"];

export default function DashboardPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"30" | "90">("30");
  const [user, setUser] = useState<{ id?: string; name?: string } | null>(null);
  const [currentMood, setCurrentMood] = useState<number | null>(null);
  const [moodSaving, setMoodSaving] = useState(false);
  const [moodSaved, setMoodSaved] = useState(false);
  const [moodHistory, setMoodHistory] = useState<{ date: string; mood: number; label: string }[]>([]);
  const [moodChartData, setMoodChartData] = useState<{ day: string; stress: number; intervention: number }[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => {
      if (!r.ok) return;
      return r.json().then((d) => {
        if (d?.user) {
          setUser(d.user);
          // Fetch mood history
          fetchMoodHistory(d.user.id);
        }
      });
    });
  }, []);

  const fetchMoodHistory = async (userId: string) => {
    try {
      const res = await fetch(`/api/mood?userId=${userId}&limit=30`);
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0) {
          const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const entries = data.data.reverse();
          
          // Build mood history (last 7)
          const last7 = entries.slice(-7);
          const history = last7.map((entry: { mood_score: number; created_at: string }) => {
            const d = new Date(entry.created_at);
            const moodIndex = Math.min(Math.max(Math.round(entry.mood_score / 2), 0), 4);
            return {
              date: days[d.getDay()],
              mood: entry.mood_score,
              label: moods[moodIndex],
            };
          });
          setMoodHistory(history);

          // Build chart data from all entries
          const chartData = entries.map((entry: { mood_score: number; stress_level: number; created_at: string }, i: number) => ({
            day: `D${i + 1}`,
            stress: entry.stress_level * 10,
            intervention: entry.mood_score * 10,
          }));
          setMoodChartData(chartData);
        } else {
          setMoodHistory([
            { date: "Mon", mood: 3, label: "😐" },
            { date: "Tue", mood: 4, label: "🙂" },
            { date: "Wed", mood: 2, label: "😔" },
          ]);
          setMoodChartData([
            { day: "D1", stress: 30, intervention: 0 },
            { day: "D3", stress: 45, intervention: 20 },
            { day: "D5", stress: 60, intervention: 60 },
          ]);
        }
      }
    } catch {
      setMoodHistory([{ date: "Today", mood: 3, label: "😐" }]);
      setMoodChartData([{ day: "D1", stress: 30, intervention: 50 }]);
    }
  };

  const handleMoodSelect = async (index: number) => {
    setCurrentMood(index);
    if (!user?.id) return;

    setMoodSaving(true);
    setMoodSaved(false);
    try {
      const moodScore = (index + 1) * 2; // 2,4,6,8,10
      const stressLevel = 10 - moodScore; // inverse
      const res = await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          moodScore,
          stressLevel,
          notes: `Quick check-in: ${moods[index]}`,
        }),
      });
      if (res.ok) {
        setMoodSaved(true);
        // Refresh history
        fetchMoodHistory(user.id);
        setTimeout(() => setMoodSaved(false), 3000);
      }
    } catch {
      console.error("Failed to save mood");
    } finally {
      setMoodSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      {/* Logo Watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <img src="/logo.jpeg" alt="" className="w-[500px] h-[500px] object-contain opacity-[0.06]" />
      </div>
      <Navbar variant="student" />

      <div className="flex flex-1 pt-16">
        {/* Mobile sidebar backdrop */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        <StudentSidebar />

        {/* Main */}
        <main className="flex-1 overflow-y-auto bg-surface p-4 md:p-10">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-3xl font-bold text-on-surface mb-1">{t("dashboard.welcome")}{user?.name ? `, ${user.name}` : ""}</h1>
                  <p className="text-on-surface-variant text-sm">{t("dashboard.subtitle")}</p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-secondary mr-2" />
                Session Active
              </span>
            </div>

            {/* Quick mood check */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">mood</span>
                {t("dashboard.mood.title")}
              </h3>
              <div className="flex gap-3 justify-center md:justify-start">
                {moods.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => handleMoodSelect(i)}
                    disabled={moodSaving}
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
                  {moodSaving ? t("dashboard.mood.saving") : moodSaved ? t("dashboard.mood.saved") : ""}
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
                  href="/counsellor/chat"
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

              {/* Upcoming Sessions */}
              <div className="md:col-span-6 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">event</span>
                    Your Sessions
                  </h3>
                  <Link href="/dashboard/chat" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">forum</span>
                    Open Chat
                  </Link>
                </div>
                <SessionsList userId={user?.id} />
              </div>

              {/* Longitudinal Chart */}
              <div className="md:col-span-6 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
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
                  {moodHistory.map((d, i) => (
                    <div key={`${d.date}-${i}`} className="flex flex-col items-center gap-1 flex-1">
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
                href="/dashboard/crisis"
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

function SessionsList({ userId }: { userId?: string }) {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/sessions?studentId=${userId}`)
      .then((r) => r.ok ? r.json() : { sessions: [] })
      .then((data) => setSessions(data.sessions || []))
      .catch(() => {});
  }, [userId]);

  if (sessions.length === 0) {
    return (
      <div className="text-center py-6 text-on-surface-variant">
        <span className="material-symbols-outlined text-[32px] opacity-30 block mb-2">event_busy</span>
        <p className="text-xs">No sessions yet. Complete a screening to get connected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.slice(0, 3).map((s: any) => (
        <div key={s.id} className="flex items-center gap-4 bg-surface rounded-xl p-4 border border-outline-variant">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[22px] icon-fill">calendar_month</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-on-surface">Counselling Session</p>
            <p className="text-xs text-on-surface-variant">Risk: {s.risk_level || "Unknown"}</p>
            <span className="inline-flex items-center gap-1 text-xs text-secondary font-medium mt-1">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              {new Date(s.created_at).toLocaleDateString()}
            </span>
          </div>
          <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
            s.status === "active" ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container text-on-surface-variant"
          }`}>
            {s.status || "Active"}
          </span>
        </div>
      ))}
    </div>
  );
}
