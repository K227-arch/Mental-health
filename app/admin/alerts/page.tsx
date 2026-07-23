"use client";
import { useState, useEffect } from "react";
import clsx from "clsx";

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [customMsg, setCustomMsg] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => { loadAlerts(); }, []);

  const loadAlerts = async () => {
    const r = await fetch("/api/notifications?userId=counsellor-system");
    if (r.ok) { const d = await r.json(); setAlerts(d.notifications || []); }
    setLoading(false);
  };

  const markRead = async (id: string) => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: id }) });
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const sendCustomAlert = async () => {
    if (!customMsg.trim()) return;
    setSending(true);
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "counsellor-system", title: "🔔 Admin Alert", body: customMsg, type: "alert", link: "/counsellor" }) });
    setCustomMsg(""); setSending(false);
    alert("Alert sent to counsellors.");
  };

  const filtered = filter === "all" ? alerts : alerts.filter(a => a.type === filter);
  const typeCounts = { all: alerts.length, critical: alerts.filter(a => a.type === "critical").length, alert: alerts.filter(a => a.type === "alert").length, info: alerts.filter(a => a.type === "info").length };

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Pending Alerts</h1>
          <p className="text-on-surface-variant mt-1">System alerts, crisis notifications, and pending counsellor tasks.</p>
        </div>
        {typeCounts.critical > 0 && (
          <span className="text-xs bg-error text-on-error px-3 py-1.5 rounded-full font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">emergency</span>
            {typeCounts.critical} critical
          </span>
        )}
      </div>

      {/* Send Custom Alert */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
        <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">send</span>
          Send Custom Alert to Counsellors
        </h3>
        <div className="flex gap-3">
          <input value={customMsg} onChange={e => setCustomMsg(e.target.value)} placeholder="Type your message to all counsellors..."
            className="flex-1 px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm rounded-xl focus:ring-2 focus:ring-primary/30 outline-none" />
          <button onClick={sendCustomAlert} disabled={sending || !customMsg.trim()} className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-90">
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[["all","All"], ["critical","Critical"], ["alert","Alerts"], ["info","Info"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} className={clsx("px-4 py-2 rounded-full text-xs font-semibold transition-colors", filter === val ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high")}>
            {label} ({typeCounts[val as keyof typeof typeCounts]})
          </button>
        ))}
        {alerts.length > 0 && (
          <button onClick={async () => { for (const a of alerts) { await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: a.id }) }); } setAlerts([]); }}
            className="ml-auto px-4 py-2 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors">
            Clear All
          </button>
        )}
      </div>

      {/* Alerts list */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><span className="material-symbols-outlined animate-spin text-[24px] mr-2">progress_activity</span></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-lowest border border-outline-variant rounded-xl">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 block mb-3">notifications_none</span>
          <p className="text-sm text-on-surface-variant">No alerts to display.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a: any) => (
            <div key={a.id} className={clsx("flex items-start gap-4 p-4 rounded-xl border transition-all", a.type === "critical" ? "bg-error-container/20 border-error/30" : a.type === "alert" ? "bg-secondary-container/10 border-secondary/20" : "bg-surface-container-lowest border-outline-variant/30")}>
              <span className={clsx("material-symbols-outlined text-[22px] mt-0.5 shrink-0", a.type === "critical" ? "text-error" : a.type === "alert" ? "text-secondary" : "text-primary")}>
                {a.type === "critical" ? "emergency" : a.type === "alert" ? "warning" : "info"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface">{a.title}</p>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{a.body}</p>
                <p className="text-[10px] text-on-surface-variant/60 mt-2">{new Date(a.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => markRead(a.id)} className="shrink-0 p-1.5 rounded-lg hover:bg-surface-container transition-colors" title="Dismiss">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">close</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
