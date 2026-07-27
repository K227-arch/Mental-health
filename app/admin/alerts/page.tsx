"use client";
import { useState, useEffect } from "react";
import clsx from "clsx";

type AlertCategory = "all" | "critical" | "alert" | "info" | "ai" | "chat";

const categoryLabel: Record<AlertCategory, string> = {
  all: "All", critical: "Crisis / Critical", alert: "Alerts", info: "Info", ai: "AI Analysis", chat: "Chat & Messages",
};

const priorityOrder: Record<string, number> = { critical: 0, alert: 1, ai: 2, info: 3 };

function categorize(n: any): AlertCategory {
  if (n.type === "critical") return "critical";
  if (n.title?.includes("Crisis") || n.title?.includes("Question 9") || n.title?.includes("Flagged")) return "critical";
  if (n.title?.includes("AI Analysis") || n.title?.includes("NLP") || n.title?.includes("Stage")) return "ai";
  if (n.title?.includes("message") || n.title?.includes("Message") || n.title?.includes("Journal")) return "chat";
  if (n.type === "alert" || n.title?.includes("Alert")) return "alert";
  return "info";
}

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AlertCategory>("all");
  const [customMsg, setCustomMsg] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => { loadAlerts(); }, []);

  const loadAlerts = async () => {
    setLoading(true);
    // Pull ALL counsellor-system notifications = full audit log
    const [r1, r2] = await Promise.all([
      fetch("/api/notifications?userId=counsellor-system&limit=100"),
      fetch("/api/notifications?userId=admin-system&limit=50"),
    ]);
    const d1 = r1.ok ? await r1.json() : { notifications: [] };
    const d2 = r2.ok ? await r2.json() : { notifications: [] };

    const combined = [
      ...(d1.notifications || []),
      ...(d2.notifications || []),
    ].sort((a, b) => {
      // Sort by priority then date
      const pa = priorityOrder[categorize(a)] ?? 9;
      const pb = priorityOrder[categorize(b)] ?? 9;
      if (pa !== pb) return pa - pb;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Deduplicate by id
    const seen = new Set();
    const unique = combined.filter(n => { if (seen.has(n.id)) return false; seen.add(n.id); return true; });
    setAlerts(unique);
    setLoading(false);
  };

  const markRead = async (id: string) => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: id }) });
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const sendCustomAlert = async () => {
    if (!customMsg.trim()) return;
    setSending(true);
    await Promise.all([
      fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "counsellor-system", title: "🔔 Admin Alert", body: customMsg, type: "alert", link: "/counsellor" }) }),
      fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "admin-system", title: "🔔 Alert Sent", body: customMsg, type: "info", link: "/admin/alerts" }) }),
    ]);
    setCustomMsg(""); setSending(false);
    await loadAlerts();
    alert("Alert sent to counsellors.");
  };

  const filtered = filter === "all" ? alerts : alerts.filter(a => categorize(a) === filter);

  const counts: Record<AlertCategory, number> = {
    all: alerts.length,
    critical: alerts.filter(a => categorize(a) === "critical").length,
    alert: alerts.filter(a => categorize(a) === "alert").length,
    ai: alerts.filter(a => categorize(a) === "ai").length,
    chat: alerts.filter(a => categorize(a) === "chat").length,
    info: alerts.filter(a => categorize(a) === "info").length,
  };

  const iconMap: Record<AlertCategory, string> = { all: "notifications", critical: "emergency", alert: "warning", ai: "neurology", chat: "chat", info: "info" };
  const colorMap: Record<AlertCategory, string> = { all: "text-on-surface", critical: "text-error", alert: "text-secondary", ai: "text-primary", chat: "text-on-surface", info: "text-on-surface-variant" };
  const bgMap: Record<AlertCategory, string> = { all: "", critical: "bg-error-container/20 border-error/30", alert: "bg-secondary-container/10 border-secondary/20", ai: "bg-primary-container/10 border-primary/20", chat: "bg-surface-container border-outline-variant/30", info: "bg-surface-container-lowest border-outline-variant/30" };

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Pending Alerts & Audit Log</h1>
          <p className="text-on-surface-variant mt-1">All system activity — crisis alerts, AI analyses, chat events, and admin actions.</p>
        </div>
        <div className="flex items-center gap-2">
          {counts.critical > 0 && (
            <span className="text-xs bg-error text-on-error px-3 py-1.5 rounded-full font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">emergency</span>
              {counts.critical} critical
            </span>
          )}
          <button onClick={loadAlerts} className="p-2 rounded-lg hover:bg-surface-container transition-colors" title="Refresh">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">refresh</span>
          </button>
        </div>
      </div>

      {/* Send Custom Alert */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
        <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">send</span>
          Send Custom Alert to All Counsellors
        </h3>
        <div className="flex gap-3">
          <input value={customMsg} onChange={e => setCustomMsg(e.target.value)} placeholder="Type your message..."
            className="flex-1 px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm rounded-xl focus:ring-2 focus:ring-primary/30 outline-none" />
          <button onClick={sendCustomAlert} disabled={sending || !customMsg.trim()} className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-90">
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(categoryLabel) as AlertCategory[]).map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
              filter === cat ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            )}>
            <span className={`material-symbols-outlined text-[14px] ${filter === cat ? "" : colorMap[cat]}`}>{iconMap[cat]}</span>
            {categoryLabel[cat]} ({counts[cat]})
          </button>
        ))}
        {alerts.length > 0 && (
          <button onClick={async () => {
            for (const a of alerts.slice(0, 20)) { await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: a.id }) }); }
            setAlerts([]);
          }} className="ml-auto px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant hover:bg-error-container/30 hover:text-error transition-colors">
            Clear All
          </button>
        )}
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><span className="material-symbols-outlined animate-spin text-[24px] mr-2 text-primary">progress_activity</span><span className="text-on-surface-variant">Loading audit log...</span></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-lowest border border-outline-variant rounded-xl">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 block mb-3">notifications_none</span>
          <p className="text-sm text-on-surface-variant">No {filter !== "all" ? categoryLabel[filter].toLowerCase() : ""} alerts to display.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a: any) => {
            const cat = categorize(a);
            return (
              <div key={a.id} className={clsx("flex items-start gap-4 p-4 rounded-xl border transition-all", bgMap[cat])}>
                <span className={clsx("material-symbols-outlined text-[20px] mt-0.5 shrink-0", colorMap[cat])}>
                  {iconMap[cat]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-on-surface">{a.title}</p>
                    <span className={clsx("text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase", {
                      "bg-error-container text-on-error-container": cat === "critical",
                      "bg-secondary-container text-on-secondary-container": cat === "alert",
                      "bg-primary-container text-on-primary-container": cat === "ai",
                      "bg-surface-container-high text-on-surface": cat === "info" || cat === "chat",
                    })}>
                      {categoryLabel[cat]}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed line-clamp-2">{a.body}</p>
                  <p className="text-[10px] text-on-surface-variant/60 mt-1.5">{new Date(a.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => markRead(a.id)} className="shrink-0 p-1.5 rounded-lg hover:bg-surface-container transition-colors" title="Dismiss">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">close</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
