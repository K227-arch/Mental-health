"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { insforge, getSeverity, generateXAI, computeTrend } from "@/lib/insforge";
import type { CounsellorSession, Referral, Notification, ScreeningResult } from "@/lib/insforge";
import clsx from "clsx";

type RiskLevel = "Critical" | "High" | "Moderate" | "Minimal";

const RISK_COLORS: Record<RiskLevel, { border: string; badge: string; text: string }> = {
  Critical: { border: "border-l-error", badge: "bg-error-container text-on-error-container", text: "text-error" },
  High: { border: "border-l-secondary-container", badge: "bg-secondary-container text-on-secondary-container", text: "text-secondary" },
  Moderate: { border: "border-l-surface-container-highest", badge: "bg-surface-container-highest text-on-surface", text: "text-on-surface" },
  Minimal: { border: "border-l-outline-variant", badge: "bg-surface-container-low border border-outline-variant text-on-surface-variant", text: "text-on-surface-variant" },
};

export default function CounsellorDashboard() {
  const router = useRouter();
  const [sessions, setSessions] = useState<CounsellorSession[]>([]);
  const [selected, setSelected] = useState<CounsellorSession | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [studentScreenings, setStudentScreenings] = useState<ScreeningResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [filter, setFilter] = useState<"All" | RiskLevel>("All");
  const [logText, setLogText] = useState("");
  const [loggingIntervention, setLoggingIntervention] = useState(false);

  const loadData = useCallback(async () => {
    const [sessRes, notifRes] = await Promise.all([
      insforge.database.from("counsellor_sessions").select().eq("status", "active").order("updated_at", { ascending: false }),
      insforge.database.from("notifications").select().eq("user_id", "counsellor").order("created_at", { ascending: false }).limit(20),
    ]);
    if (sessRes.data) {
      const s = sessRes.data as CounsellorSession[];
      setSessions(s);
      if (!selected && s.length > 0) setSelected(s[0]);
    }
    if (notifRes.data) setNotifications(notifRes.data as Notification[]);
    setLoading(false);
  }, [selected]);

  useEffect(() => { loadData(); }, [loadData]);

  // Load referrals + screening history when selected session changes
  useEffect(() => {
    if (!selected) return;
    insforge.database.from("referrals").select()
      .eq("student_id", selected.student_id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setReferrals(data as Referral[]); });

    // Load student's screening history for XAI + trend
    insforge.database.from("screening_results").select()
      .eq("user_id", selected.student_id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => { if (data) setStudentScreenings(data as ScreeningResult[]); });
  }, [selected]);

  // Real-time subscription for new sessions and notifications
  useEffect(() => {
    let cleanup = false;
    (async () => {
      insforge.realtime.on("connect", () => {});
      await insforge.realtime.connect();
      const sub = await insforge.realtime.subscribe("counsellor-updates");
      if (sub.ok && !cleanup) {
        insforge.realtime.on("new_session", () => loadData());
        insforge.realtime.on("session_updated", () => loadData());
        insforge.realtime.on("new_notification", () => loadData());
      }
    })();
    return () => {
      cleanup = true;
      insforge.realtime.unsubscribe("counsellor-updates");
    };
  }, [loadData]);

  const markNotifRead = async (id: string) => {
    await insforge.database.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const logIntervention = async () => {
    if (!selected || !logText.trim()) return;
    setLoggingIntervention(true);
    await insforge.database.from("counsellor_sessions")
      .update({ notes: logText, intervention_logged: true, updated_at: new Date().toISOString() })
      .eq("id", selected.id);
    setSelected(prev => prev ? { ...prev, notes: logText, intervention_logged: true } : prev);
    setActionMsg("Intervention logged successfully.");
    setLogText("");
    setTimeout(() => setActionMsg(""), 3000);
    setLoggingIntervention(false);
  };

  const escalate = async () => {
    if (!selected) return;
    await insforge.database.from("counsellor_sessions")
      .update({ risk_level: "Critical", updated_at: new Date().toISOString() })
      .eq("id", selected.id);
    await insforge.database.from("notifications").insert([{
      user_id: selected.student_id,
      title: "Urgent: Please contact your counsellor",
      body: "Your counsellor has flagged your case as requiring immediate attention.",
      type: "critical",
      link: "/crisis",
    }]);
    setActionMsg("Case escalated to Critical and student notified.");
    setSessions(prev => prev.map(s => s.id === selected.id ? { ...s, risk_level: "Critical" } : s));
    setSelected(prev => prev ? { ...prev, risk_level: "Critical" } : prev);
    setTimeout(() => setActionMsg(""), 3000);
  };

  const scheduleSession = async () => {
    if (!selected) return;
    router.push(`/schedule?session=${selected.id}&student=${selected.student_id}`);
    setActionMsg("Redirecting to session scheduler…");
    setTimeout(() => setActionMsg(""), 3000);
  };

  const createReferral = async (type: string, destination: string) => {
    if (!selected) return;
    const { data } = await insforge.database.from("referrals").insert([{
      student_id: selected.student_id,
      counsellor_id: "counsellor",
      session_id: selected.id,
      referral_type: type,
      destination,
      status: "pending",
    }]).select();
    if (data) setReferrals(prev => [data[0] as Referral, ...prev]);
    setActionMsg(`Referral to ${destination} created.`);
    setTimeout(() => setActionMsg(""), 3000);
  };

  const dismissAlert = async () => {
    if (!selected) return;
    await insforge.database.from("counsellor_sessions")
      .update({ status: "reviewed", updated_at: new Date().toISOString() })
      .eq("id", selected.id);
    setSessions(prev => prev.filter(s => s.id !== selected.id));
    setSelected(sessions.find(s => s.id !== selected.id) || null);
  };

  const filtered = filter === "All" ? sessions : sessions.filter(s => s.risk_level === filter);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const criticalCount = sessions.filter(s => s.risk_level === "Critical").length;

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-background">Decision Support Overview</h1>
          <p className="text-on-surface-variant mt-1">Monitoring {sessions.length} active anonymized cases · Real-time</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-error-container text-on-error-container rounded-full text-xs font-semibold">
              <span className="material-symbols-outlined text-[14px]">notifications</span>
              {unreadCount} new alert{unreadCount > 1 ? "s" : ""}
            </span>
          )}
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-highest text-on-surface rounded-lg text-sm font-medium hover:bg-surface-variant transition-colors">
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="bg-secondary-container text-on-secondary-container px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined icon-fill text-[18px]">check_circle</span>
          {actionMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Critical Alerts", value: criticalCount.toString(), icon: "warning", color: "text-error", trend: "+recent", trendIcon: "trending_up" },
          { label: "Active Sessions", value: sessions.length.toString(), icon: "pending_actions", color: "text-secondary", trend: "Require attention", trendIcon: "schedule" },
          { label: "Unread Notifications", value: unreadCount.toString(), icon: "notifications", color: "text-primary", trend: "New alerts", trendIcon: "mark_unread_chat_alt" },
          { label: "Avg PHQ-9 Score", value: sessions.length > 0 ? (sessions.reduce((a, s) => a + (s.phq9_score || 0), 0) / sessions.length).toFixed(1) : "—", icon: "monitor_heart", color: "text-primary", trend: "Across all cases", trendIcon: "show_chart" },
        ].map(stat => (
          <div key={stat.label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col gap-2 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-xs text-on-surface-variant font-medium">{stat.label}</span>
              <span className={`material-symbols-outlined icon-fill text-[22px] ${stat.color}`}>{stat.icon}</span>
            </div>
            <div className="text-3xl font-black text-on-background">{stat.value}</div>
            <div className={`text-xs flex items-center gap-1 ${stat.color}`}>
              <span className="material-symbols-outlined text-[14px]">{stat.trendIcon}</span>
              {stat.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Main 3-col layout */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Case List */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-on-surface">Active Queue</h3>
            <select value={filter} onChange={e => setFilter(e.target.value as typeof filter)} className="text-xs bg-surface border border-outline-variant rounded-lg px-2 py-1.5 text-on-surface-variant outline-none focus:ring-1 focus:ring-primary">
              <option>All</option><option>Critical</option><option>High</option><option>Moderate</option><option>Minimal</option>
            </select>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant text-sm">
              <span className="material-symbols-outlined text-[40px] block mb-2 opacity-30">inbox</span>
              No cases in queue
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[540px] pr-1">
              {filtered.map(s => {
                const risk = (s.risk_level || "Minimal") as RiskLevel;
                const colors = RISK_COLORS[risk] || RISK_COLORS.Minimal;
                const sev = s.phq9_score ? getSeverity(s.phq9_score) : null;
                return (
                  <button key={s.id} onClick={() => setSelected(s)}
                    className={clsx("w-full text-left bg-surface-container-lowest border-l-4 border-y border-r border-outline-variant rounded-r-xl p-4 transition-colors relative overflow-hidden",
                      colors.border, selected?.id === s.id ? "bg-surface-container-low shadow-md" : "hover:bg-surface-container-low")}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-sm font-bold text-on-background block">{s.student_name || s.student_id}</span>
                        <span className="text-xs text-on-surface-variant">Last: {new Date(s.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <span className={clsx("text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold", colors.badge)}>{risk}</span>
                    </div>
                    {s.phq9_score && <p className={clsx("text-xs font-medium", sev?.color)}>PHQ-9: {s.phq9_score} ({sev?.label})</p>}
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-outline flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        {new Date(s.created_at).toLocaleDateString()}
                      </p>
                      <Link
                        href={`/counsellor/student/${s.student_id}`}
                        onClick={e => e.stopPropagation()}
                        className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-0.5"
                      >
                        Analytics
                        <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                      </Link>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected ? (
          <div className="lg:col-span-6 bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col overflow-hidden shadow-sm">
            <div className="p-5 border-b border-outline-variant flex justify-between items-start bg-surface-bright">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-on-background">{selected.student_name || selected.student_id}</h2>
                  <span className={clsx("text-xs px-2 py-1 rounded uppercase tracking-wider font-semibold",
                    RISK_COLORS[(selected.risk_level || "Minimal") as RiskLevel]?.badge || RISK_COLORS.Minimal.badge)}>
                    {selected.risk_level || "Minimal"} Risk
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant">Session started: {new Date(selected.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/counsellor/chat?session=${selected.id}&student=${selected.student_id}`}
                  className="p-2 rounded-full border border-outline-variant text-primary hover:bg-primary-container transition-colors" title="Open Chat">
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                </Link>
                <button className="p-2 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors" title="History">
                  <span className="material-symbols-outlined text-[20px]">history</span>
                </button>
              </div>
            </div>

            <div className="p-5 md:p-6 flex-1 overflow-y-auto flex flex-col gap-5">
              {/* Real XAI Risk Interpretation */}
              {(() => {
                const latestScreen = studentScreenings[0];
                const xai = latestScreen
                  ? generateXAI(latestScreen.responses || {}, latestScreen.score)
                  : null;
                const trend = studentScreenings.length > 0
                  ? computeTrend(studentScreenings.map(s => s.score))
                  : null;

                return (
                  <div className="bg-primary-fixed/30 border border-primary-fixed-dim rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary text-on-primary flex items-center justify-center">
                          <span className="material-symbols-outlined icon-fill text-[18px]">psychiatry</span>
                        </div>
                        <h3 className="text-sm font-bold text-on-primary-fixed-variant">AI Risk Interpretation (XAI)</h3>
                      </div>
                      {xai && (
                        <span className="text-xs bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full font-semibold">
                          {xai.confidence}% confidence
                        </span>
                      )}
                    </div>

                    {/* Summary */}
                    <p className="text-sm text-on-surface mb-4 bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/50">
                      {xai
                        ? xai.summary
                        : `${selected.student_name || selected.student_id} is classified as ${selected.risk_level || "Minimal"} Risk. ${selected.ai_summary || "No screening data available yet."}`}
                    </p>

                    {/* Trend */}
                    {trend && (
                      <div className={clsx(
                        "flex items-center gap-3 p-3 rounded-xl mb-4 border",
                        trend.direction === "improving" ? "bg-secondary-container/30 border-secondary-fixed-dim" :
                        trend.direction === "worsening" || trend.direction === "critical_spike" ? "bg-error-container/30 border-error-container" :
                        "bg-surface-container border-outline-variant"
                      )}>
                        <span className={`material-symbols-outlined text-[22px] shrink-0 ${trend.color}`}>{trend.icon}</span>
                        <div>
                          <p className={`text-xs font-bold ${trend.color}`}>Trend: {trend.label}</p>
                          <p className="text-xs text-on-surface-variant">{trend.description}</p>
                        </div>
                      </div>
                    )}

                    {/* Per-question breakdown */}
                    {xai && (
                      <div>
                        <p className="text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">
                          Question Breakdown
                        </p>
                        <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1">
                          {xai.markers.map((m, i) => (
                            <div key={i} className={clsx(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs",
                              m.flag ? "bg-error-container/20 border-error-container/50" :
                              m.severity === "high" || m.severity === "critical" ? "bg-primary-fixed/20 border-primary-fixed-dim" :
                              "bg-surface-container border-outline-variant/30"
                            )}>
                              <span className={clsx(
                                "w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0",
                                m.score === 0 ? "bg-secondary-container text-on-secondary-container" :
                                m.score === 1 ? "bg-surface-container-highest text-on-surface" :
                                m.score === 2 ? "bg-primary-container text-on-primary-container" :
                                "bg-error-container text-on-error-container"
                              )}>
                                {m.score}
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-on-surface truncate block">Q{i + 1}: {m.question}</span>
                                <span className="text-on-surface-variant">{m.answer}</span>
                              </div>
                              {m.flag && (
                                <span className="material-symbols-outlined icon-fill text-error text-[16px] shrink-0">flag</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Flagged questions summary */}
                        {xai.flaggedQuestions.length > 0 && (
                          <div className="mt-3 p-3 bg-error-container/20 border border-error-container rounded-xl">
                            <p className="text-xs font-bold text-error flex items-center gap-1 mb-1">
                              <span className="material-symbols-outlined text-[14px]">warning</span>
                              Flagged: Q{xai.flaggedQuestions.join(", Q")}
                            </p>
                            <p className="text-xs text-on-surface-variant">
                              {xai.flaggedQuestions.includes(9)
                                ? "Question 9 (self-harm thoughts) was endorsed — immediate follow-up required."
                                : "High-severity responses detected. Review with student urgently."}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Session metadata strip */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "monitor_heart", label: "PHQ-9 Score", value: selected.phq9_score ? `${selected.phq9_score} — ${getSeverity(selected.phq9_score).label}` : "Not yet assessed", color: "text-error" },
                  { icon: "schedule", label: "Session Active", value: `${Math.floor((Date.now() - new Date(selected.created_at).getTime()) / 3600000)}h`, color: "text-secondary" },
                  { icon: "task_alt", label: "Intervention", value: selected.intervention_logged ? "Logged ✓" : "Not logged", color: "text-primary" },
                  { icon: "local_hospital", label: "Status", value: selected.status, color: "text-tertiary" },
                ].map(item => (
                  <div key={item.label} className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/50 flex items-start gap-2">
                    <span className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${item.color}`}>{item.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-on-surface mb-0.5">{item.label}</h4>
                      <p className="text-xs text-on-surface-variant">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {selected.notes && (
                <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4">
                  <h3 className="text-xs font-bold text-on-surface mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">note</span>Intervention Notes
                  </h3>
                  <p className="text-sm text-on-surface-variant italic">{selected.notes}</p>
                </div>
              )}

              {/* Log intervention */}
              <div>
                <h3 className="text-sm font-bold text-on-surface mb-3">Log Intervention Note</h3>
                <textarea value={logText} onChange={e => setLogText(e.target.value)} placeholder="Describe the intervention taken…"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-sm text-on-surface resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>

            <div className="p-4 border-t border-outline-variant bg-surface-bright flex justify-between items-center gap-3 flex-wrap">
              <div className="flex gap-2">
                <button onClick={dismissAlert} className="px-4 py-2 rounded-lg border border-outline text-on-surface-variant text-sm font-medium hover:bg-surface-container transition-colors">
                  Mark Reviewed
                </button>
                {/* Close session with outcome */}
                <button
                  onClick={async () => {
                    if (!selected) return;
                    const outcome = window.prompt("Enter outcome note before closing (optional):");
                    await insforge.database.from("counsellor_sessions")
                      .update({
                        status: "closed",
                        notes: outcome ? `[Closed] ${outcome}` : selected.notes,
                        intervention_logged: true,
                        updated_at: new Date().toISOString(),
                      })
                      .eq("id", selected.id);
                    setSessions(prev => prev.filter(s => s.id !== selected.id));
                    setSelected(sessions.find(s => s.id !== selected.id) || null);
                    setActionMsg("Session closed with outcome recorded.");
                    setTimeout(() => setActionMsg(""), 3000);
                  }}
                  className="px-4 py-2 rounded-lg border border-secondary text-secondary text-sm font-medium hover:bg-secondary-container/30 transition-colors"
                >
                  Close Session
                </button>
              </div>
              <div className="flex gap-2">
                <Link href={`/counsellor/chat?session=${selected.id}&student=${selected.student_id}`}
                  className="px-4 py-2 rounded-lg bg-secondary-container text-on-secondary-container text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  Open Chat
                </Link>
                <button onClick={logIntervention} disabled={loggingIntervention || !logText.trim()}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity flex items-center gap-1 disabled:opacity-50">
                  <span className="material-symbols-outlined text-[16px]">edit_document</span>
                  {loggingIntervention ? "Saving…" : "Log Intervention"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-6 bg-surface-container-lowest border border-outline-variant rounded-xl flex items-center justify-center shadow-sm">
            <div className="text-center text-on-surface-variant p-10">
              <span className="material-symbols-outlined text-[60px] block mb-3 opacity-20">person_search</span>
              <p className="text-sm">Select a case from the queue</p>
            </div>
          </div>
        )}

        {/* Action Center + Notifications */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          {/* Actions */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">bolt</span>Action Center
            </h3>
            <div className="flex flex-col gap-2">
              <button onClick={scheduleSession} disabled={!selected} className="w-full flex items-center gap-3 px-4 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-medium shadow-sm hover:opacity-90 transition-opacity disabled:opacity-40">
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>Schedule Session
              </button>              <Link href={`/counsellor/chat?session=${selected?.id || ""}&student=${selected?.student_id || ""}`}
                className="w-full flex items-center gap-3 px-4 py-2.5 border border-outline-variant bg-surface hover:bg-surface-container rounded-lg text-sm text-on-surface transition-colors">
                <span className="material-symbols-outlined text-[18px]">chat</span>Open Chat
              </Link>
              <button onClick={() => selected && createReferral("clinical", "External Psychiatric")} disabled={!selected}
                className="w-full flex items-center gap-3 px-4 py-2.5 border border-outline-variant bg-surface hover:bg-surface-container rounded-lg text-sm text-on-surface transition-colors disabled:opacity-40">
                <span className="material-symbols-outlined text-[18px]">medical_services</span>Initiate Referral
              </button>
              <div className="my-1 border-t border-outline-variant" />
              <button onClick={escalate} disabled={!selected}
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-error-container text-on-error-container rounded-lg text-sm font-medium hover:bg-error/20 transition-colors disabled:opacity-40">
                <span className="material-symbols-outlined text-[18px]">contact_emergency</span>Escalate Critical
              </button>
            </div>
          </div>

          {/* Referral Tracking */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">share</span>Referral Tracking
            </h3>
            {referrals.length === 0 ? (
              <p className="text-xs text-on-surface-variant">No referrals for this student.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                {referrals.map(r => (
                  <div key={r.id} className="p-3 border border-outline-variant rounded-lg bg-surface-container-low">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-on-surface">{r.destination || r.referral_type}</span>
                      <select
                        value={r.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          await insforge.database.from("referrals")
                            .update({ status: newStatus, updated_at: new Date().toISOString() })
                            .eq("id", r.id);
                          setReferrals(prev => prev.map(ref => ref.id === r.id ? { ...ref, status: newStatus } : ref));
                        }}
                        className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold border-0 outline-none cursor-pointer ${
                          r.status === "completed" ? "bg-secondary-container text-on-secondary-container" :
                          r.status === "pending" ? "bg-surface-container border border-outline text-on-surface-variant" :
                          "bg-error-container text-on-error-container"
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <p className="text-xs text-on-surface-variant">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex-1">
            <h3 className="text-sm font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant flex items-center justify-between">
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">notifications</span>Alerts</span>
              {unreadCount > 0 && <span className="text-xs bg-error text-on-error rounded-full px-2 py-0.5">{unreadCount}</span>}
            </h3>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {notifications.slice(0, 8).map(n => (
                <button key={n.id} onClick={() => markNotifRead(n.id)}
                  className={clsx("w-full text-left p-3 rounded-lg border text-xs transition-colors", n.is_read ? "bg-surface-container-low border-outline-variant/30 opacity-60" : "bg-surface border-primary/30 hover:bg-primary-container/20")}>
                  <p className={`font-bold mb-0.5 ${n.type === "critical" ? "text-error" : "text-on-surface"}`}>{n.title}</p>
                  <p className="text-on-surface-variant">{n.body}</p>
                  <p className="text-outline mt-1">{new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </button>
              ))}
              {notifications.length === 0 && <p className="text-xs text-on-surface-variant">No alerts yet.</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
