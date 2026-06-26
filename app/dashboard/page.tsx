"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { insforge, getSeverity } from "@/lib/insforge";
import type { MoodEntry, ScreeningResult, WellnessActivity } from "@/lib/insforge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { computeTrend } from "@/lib/insforge";

const MOOD_EMOJIS = ["😢", "😔", "😐", "🙂", "😊"];

export default function DashboardPage() {
  const [user, setUser] = useState<{ id: string; name: string | null; email: string } | null>(null);
  const [profile, setProfile] = useState<{ faculty?: string; year_of_study?: number; anonymous_id?: string } | null>(null);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [screeningResults, setScreeningResults] = useState<ScreeningResult[]>([]);
  const [activities, setActivities] = useState<WellnessActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingMood, setSavingMood] = useState(false);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [moodSaved, setMoodSaved] = useState(false);

  const loadData = useCallback(async (uid: string) => {
    const [moodRes, screenRes, actRes, profileRes] = await Promise.all([
      insforge.database.from("mood_entries").select().eq("user_id", uid).order("created_at", { ascending: false }).limit(30),
      insforge.database.from("screening_results").select().eq("user_id", uid).order("created_at", { ascending: false }).limit(10),
      insforge.database.from("wellness_activities").select().eq("user_id", uid).order("created_at", { ascending: false }).limit(20),
      insforge.database.from("student_profiles").select().eq("id", uid).maybeSingle(),
    ]);

    if (moodRes.data) setMoodEntries(moodRes.data as MoodEntry[]);
    if (screenRes.data) setScreeningResults(screenRes.data as ScreeningResult[]);
    if (actRes.data) setActivities(actRes.data as WellnessActivity[]);
    if (profileRes.data) setProfile(profileRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    insforge.auth.getCurrentUser().then(({ data }) => {
      if (data?.user) {
        setUser({ id: data.user.id, name: data.user.profile?.name || null, email: data.user.email });
        loadData(data.user.id);
      } else {
        setLoading(false);
      }
    });
  }, [loadData]);

  const saveMood = async (score: number, note?: string) => {
    if (!user || savingMood) return;
    setSelectedMood(score);
    setSavingMood(true);
    await insforge.database.from("mood_entries").insert([{
      user_id: user.id,
      mood_score: score + 1,
      emoji: MOOD_EMOJIS[score],
      notes: note || null,
    }]);
    setMoodSaved(true);
    setSavingMood(false);
    loadData(user.id);
  };

  // Build chart data from mood entries
  const chartData = moodEntries.slice(0, 15).reverse().map((e, i) => ({
    day: `D${i + 1}`,
    mood: e.mood_score,
    stress: e.stress_level || 0,
  }));

  // Latest screening
  const latestScreen = screeningResults[0];
  const latestSev = latestScreen ? getSeverity(latestScreen.score) : null;

  // Completed activities count
  const completedCount = activities.filter(a => a.completed).length;

  // Weekly mood chart (last 7 days)
  const last7 = moodEntries.slice(0, 7).reverse();

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center flex-col gap-4">
        <p className="text-on-surface-variant">Sign in to view your dashboard.</p>
        <Link href="/auth/sign-in" className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar variant="student" />
      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col h-[calc(100vh-64px)] sticky top-16 w-64 shrink-0 p-3 border-r border-outline-variant bg-surface-container-low">
          <div className="mb-4 px-3 mt-3">
            <h2 className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Student Portal</h2>
            <p className="text-sm font-semibold text-on-surface truncate">{user?.name || user?.email || "My Wellness"}</p>
            {profile?.anonymous_id && <p className="text-xs text-on-surface-variant">{profile.anonymous_id}</p>}
          </div>
          <nav className="flex-1 flex flex-col gap-1">
            {[
              { href: "/dashboard", label: "Dashboard", icon: "dashboard", active: true },
              { href: "/screening", label: "Daily Check-in", icon: "psychology" },
              { href: "/wellness", label: "Wellness Hub", icon: "self_improvement" },
              { href: "/crisis", label: "Crisis Support", icon: "emergency", red: true },
            ].map(item => (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${item.active ? "bg-primary-container text-on-primary-container font-bold shadow-sm" : (item as any).red ? "text-error hover:bg-error-container/30" : "text-on-surface-variant hover:bg-surface-container-high"}`}>
                <span className="material-symbols-outlined" style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto pt-4 border-t border-outline-variant">
            <Link href="/screening" className="w-full flex items-center justify-center gap-1 py-3 bg-secondary text-on-secondary rounded-lg text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Check-in
            </Link>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-surface p-4 md:p-10">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
                <div>
                  <h1 className="text-3xl font-bold text-on-surface mb-1">
                    Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
                  </h1>
                  <p className="text-on-surface-variant text-sm">Your wellness dashboard · Real-time insights</p>
                </div>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-secondary mr-2 animate-pulse" />
                  Live Sync Active
                </span>
              </div>

              {/* Quick mood check with note */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">mood</span>
                  How are you feeling right now?
                </h3>
                <div className="flex gap-3 justify-center md:justify-start mb-3">
                  {MOOD_EMOJIS.map((e, i) => (
                    <button key={i} onClick={() => setSelectedMood(i)} disabled={savingMood}
                      className={`text-2xl md:text-3xl p-2 rounded-xl transition-all hover:scale-110 disabled:cursor-wait ${selectedMood === i ? "bg-primary-container ring-2 ring-primary scale-110" : "hover:bg-surface-container"}`}>
                      {e}
                    </button>
                  ))}
                </div>
                {selectedMood !== null && !moodSaved && (
                  <div className="mt-2 animate-fade-in space-y-2">
                    <input
                      type="text"
                      id="mood-note"
                      placeholder="Add a note (optional) — e.g. 'Stressful lecture today'"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                          const note = (e.target as HTMLInputElement).value;
                          await saveMood(selectedMood, note);
                        }
                      }}
                    />
                    <button onClick={async () => {
                        const noteEl = document.getElementById("mood-note") as HTMLInputElement;
                        await saveMood(selectedMood, noteEl?.value || "");
                      }}
                      disabled={savingMood}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
                      <span className="material-symbols-outlined text-[14px]">save</span>
                      {savingMood ? "Saving…" : "Save Mood"}
                    </button>
                  </div>
                )}
                {moodSaved && <p className="text-xs text-secondary font-medium mt-2 animate-fade-in">✓ Mood recorded — dashboard updated</p>}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-on-surface-variant mb-1">Latest PHQ-9</p>
                  <p className="text-2xl font-black text-primary">{latestScreen?.score ?? "—"}</p>
                  <p className={`text-xs font-semibold mt-0.5 ${latestSev?.color || "text-on-surface-variant"}`}>{latestSev?.label || "No data yet"}</p>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-on-surface-variant mb-1">Check-ins</p>
                  <p className="text-2xl font-black text-secondary">{screeningResults.length}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Total completed</p>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-on-surface-variant mb-1">Activities Done</p>
                  <p className="text-2xl font-black text-primary">{completedCount}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Wellness exercises</p>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-on-surface-variant mb-1">Mood Entries</p>
                  <p className="text-2xl font-black text-secondary">{moodEntries.length}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Logged moods</p>
                </div>
              </div>

              {/* Digital Twin + Insights */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col shadow-sm min-h-[300px] relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-on-surface">Cognitive State Twin</h3>
                      <p className="text-xs text-on-surface-variant uppercase tracking-wide mt-0.5">Real-time Mood & Depression Index</p>
                    </div>
                  </div>
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
                          <p className="text-xl font-bold text-primary">
                            {moodEntries[0] ? MOOD_EMOJIS[(moodEntries[0].mood_score || 3) - 1] : "—"}
                          </p>
                        </div>
                        <div className="bg-surface border border-outline-variant rounded-xl p-3 min-w-[110px]">
                          <p className="text-xs text-on-surface-variant mb-1">Risk Level</p>
                          <p className={`text-lg font-bold ${latestSev?.color || "text-secondary"}`}>
                            {latestSev?.risk || "No data"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4 flex flex-col gap-4">
                  {(() => {
                    const scores = screeningResults.map(r => r.score);
                    const trend = scores.length > 0 ? computeTrend(scores) : null;
                    return (
                      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col shadow-sm flex-1">
                        <h3 className="text-sm font-semibold text-on-surface flex items-center gap-1 mb-3">
                          <span className="material-symbols-outlined text-secondary text-[20px]">lightbulb</span>
                          AI Insights & Trend
                        </h3>

                        {/* Trend indicator */}
                        {trend ? (
                          <div className={`flex items-center gap-2 p-2.5 rounded-xl mb-3 border ${
                            trend.direction === "improving" ? "bg-secondary-container/30 border-secondary-fixed-dim" :
                            trend.direction === "worsening" || trend.direction === "critical_spike" ? "bg-error-container/30 border-error-container" :
                            "bg-surface-container border-outline-variant"
                          }`}>
                            <span className={`material-symbols-outlined text-[20px] shrink-0 ${trend.color}`}>{trend.icon}</span>
                            <div>
                              <p className={`text-xs font-bold ${trend.color}`}>{trend.label}</p>
                              <p className="text-[10px] text-on-surface-variant leading-snug">{trend.description}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-on-surface-variant mb-3 leading-relaxed">
                            Complete your first PHQ-9 check-in to receive personalized insights.
                          </p>
                        )}

                        {latestScreen && (
                          <p className="text-xs text-on-surface-variant mb-3 leading-relaxed">
                            {latestScreen.score >= 15
                              ? "Your score suggests professional support is needed. Please speak with your counsellor."
                              : latestScreen.score >= 10
                              ? "Consider scheduling a counsellor session to discuss your current symptoms."
                              : "You're doing well. Keep checking in regularly."}
                          </p>
                        )}

                        <div className="mt-auto bg-surface rounded-xl p-3 border border-outline-variant flex items-center justify-between">
                          <span className="text-xs font-semibold text-on-surface">Current Risk</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            latestSev?.risk === "Critical" || latestSev?.risk === "High"
                              ? "bg-error-container text-on-error-container"
                              : latestSev?.risk === "Moderate"
                              ? "bg-primary-container text-on-primary-container"
                              : "bg-secondary-container text-on-secondary-container"
                          }`}>
                            {latestSev?.risk || "No data"}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <Link href="/crisis" className="bg-primary-container text-on-primary-container rounded-xl p-5 flex flex-col shadow-sm cursor-pointer hover:bg-primary-fixed transition-colors group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="material-symbols-outlined icon-fill text-primary">person</span>
                      </div>
                      <span className="material-symbols-outlined text-on-primary-container/50 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                    </div>
                    <h3 className="text-sm font-semibold mt-auto">Get Support</h3>
                    <p className="text-xs opacity-80 mt-1">Connect with your counsellor.</p>
                  </Link>
                </div>
              </div>

              {/* Longitudinal Chart */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-on-surface">Mood Trend</h3>
                    <p className="text-xs text-on-surface-variant">Last {chartData.length} entries</p>
                  </div>
                </div>
                {chartData.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                        <defs>
                          <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#074469" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#074469" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#006a64" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#006a64" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#c1c7cf" strokeOpacity={0.4} />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#41474e" }} />
                        <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: "#41474e" }} />
                        <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #c1c7cf", borderRadius: "8px", fontSize: "12px" }} />
                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                        <Area type="monotone" dataKey="mood" name="Mood Score" stroke="#074469" strokeWidth={2} fill="url(#moodGrad)" />
                        <Area type="monotone" dataKey="stress" name="Stress Level" stroke="#006a64" strokeWidth={2} fill="url(#stressGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-on-surface-variant text-sm">
                    <div className="text-center">
                      <span className="material-symbols-outlined text-[40px] mb-2 block opacity-30">show_chart</span>
                      Complete a check-in to see your mood trend
                    </div>
                  </div>
                )}
              </div>

              {/* Weekly mood */}
              {last7.length > 0 && (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-on-surface mb-4">Recent Moods</h3>
                  <div className="flex justify-start items-end gap-3 overflow-x-auto">
                    {last7.map((e, i) => (
                      <div key={e.id} className="flex flex-col items-center gap-1 shrink-0">
                        <span className="text-xl">{e.emoji || MOOD_EMOJIS[(e.mood_score || 3) - 1]}</span>
                        <div className="w-8 rounded-sm bg-primary/20" style={{ height: `${(e.mood_score || 1) * 12}px`, background: `rgba(7,68,105,${(e.mood_score || 1) * 0.2})` }} />
                        <span className="text-[10px] text-on-surface-variant">{new Date(e.created_at).toLocaleDateString("en", { weekday: "short" })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Screening history — clickable */}
              {screeningResults.length > 0 && (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-on-surface mb-4">Screening History</h3>
                  <div className="space-y-2">
                    {screeningResults.slice(0, 5).map(r => {
                      const s = getSeverity(r.score);
                      return (
                        <Link key={r.id} href={`/screening/${r.id}`}
                          className="flex items-center justify-between py-2.5 px-3 border border-outline-variant/40 rounded-xl hover:bg-surface-container hover:border-primary/30 transition-colors group">
                          <div className="flex items-center gap-3">
                            <span className={`text-lg font-black ${s.color}`}>{r.score}</span>
                            <div>
                              <span className="text-sm text-on-surface font-medium">{r.severity}</span>
                              {r.flagged_keywords && r.flagged_keywords.length > 0 && (
                                <span className="ml-2 text-[10px] text-error font-semibold">⚑ Flagged</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-on-surface-variant">{new Date(r.created_at).toLocaleDateString()}</span>
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40 group-hover:text-primary transition-colors">arrow_forward</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  {screeningResults.length > 5 && (
                    <Link href="/screening" className="flex items-center gap-1 text-xs text-primary font-semibold mt-3 hover:underline">
                      View all {screeningResults.length} screenings
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Link href="/screening" className="flex items-center gap-3 p-4 bg-primary text-on-primary rounded-xl shadow-sm hover:opacity-90 transition-opacity">
                  <span className="material-symbols-outlined icon-fill">psychology</span>
                  <div><div className="text-sm font-semibold">Start Check-in</div><div className="text-xs opacity-80">PHQ-9 Assessment</div></div>
                </Link>
                <Link href="/wellness" className="flex items-center gap-3 p-4 bg-secondary-container text-on-secondary-container rounded-xl shadow-sm hover:opacity-90 transition-opacity">
                  <span className="material-symbols-outlined icon-fill">self_improvement</span>
                  <div><div className="text-sm font-semibold">Wellness Hub</div><div className="text-xs opacity-80">Resources & Tools</div></div>
                </Link>
                <Link href="/schedule" className="flex items-center gap-3 p-4 bg-primary-container text-on-primary-container rounded-xl shadow-sm hover:opacity-90 transition-opacity">
                  <span className="material-symbols-outlined icon-fill">calendar_month</span>
                  <div><div className="text-sm font-semibold">Book Session</div><div className="text-xs opacity-80">Schedule counsellor</div></div>
                </Link>
                <Link href="/crisis" className="flex items-center gap-3 p-4 bg-error-container text-on-error-container rounded-xl shadow-sm hover:opacity-90 transition-opacity">
                  <span className="material-symbols-outlined icon-fill">emergency</span>
                  <div><div className="text-sm font-semibold">Crisis Support</div><div className="text-xs opacity-80">Immediate Help</div></div>
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
