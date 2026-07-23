"use client";
import { useState, useEffect } from "react";
import clsx from "clsx";

export default function AdminCounsellors() {
  const [counsellors, setCounsellors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [alertMsg, setAlertMsg] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/counsellor/students").then(r => r.ok ? r.json() : { students: [] }).then(d => {
      const all = d.students || [];
      setCounsellors(all.filter((s: any) => s.role === "counsellor"));
      setStudents(all.filter((s: any) => s.role !== "counsellor"));
      setLoading(false);
    });
  }, []);

  const sendAlert = async () => {
    if (!alertMsg.trim()) return;
    setSending(true);
    await fetch("/api/notifications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "counsellor-system", title: "🔔 Admin Alert", body: alertMsg, type: "alert", link: "/counsellor" }),
    });
    setAlertMsg(""); setSending(false);
    alert("Alert sent to all counsellors.");
  };

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Counsellors</h1>
          <p className="text-on-surface-variant mt-1">Oversee all mental health professionals on the platform.</p>
        </div>
        <span className="text-xs bg-secondary-container text-on-secondary-container px-3 py-1.5 rounded-full font-semibold">{counsellors.length} counsellor{counsellors.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Send Alert */}
      <div className="bg-error-container/20 border border-error/20 rounded-xl p-5">
        <h3 className="text-sm font-bold text-on-surface mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-error text-[18px]">notifications_active</span>
          Send Alert to All Counsellors
        </h3>
        <div className="flex gap-3 mt-3">
          <input value={alertMsg} onChange={e => setAlertMsg(e.target.value)} placeholder="Type your alert message..."
            className="flex-1 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/40 text-on-surface text-sm rounded-xl focus:ring-2 focus:ring-primary/30 outline-none" />
          <button onClick={sendAlert} disabled={sending || !alertMsg.trim()} className="px-5 py-2.5 bg-error text-on-error rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity">
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      {/* Counsellors List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-[24px] mr-2">progress_activity</span> Loading...
        </div>
      ) : counsellors.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-lowest border border-outline-variant rounded-xl">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 block mb-3">support_agent</span>
          <p className="text-sm text-on-surface-variant">No counsellors registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {counsellors.map((c: any) => (
            <div key={c.id} className={clsx("bg-surface-container-lowest border rounded-xl p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow", selected?.id === c.id ? "border-primary" : "border-outline-variant")}
              onClick={() => setSelected(selected?.id === c.id ? null : c)}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                  <span className="text-sm font-bold text-on-primary-container">{(c.name || "?").slice(0,2).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-semibold text-on-surface text-sm">{c.name || "Counsellor"}</p>
                  <p className="text-xs text-on-surface-variant">{c.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-surface-container rounded-lg p-2">
                  <p className="text-on-surface-variant">Caseload</p>
                  <p className="font-bold text-on-surface">{students.filter(s => s.sessionId).length} students</p>
                </div>
                <div className="bg-surface-container rounded-lg p-2">
                  <p className="text-on-surface-variant">Status</p>
                  <p className="font-bold text-secondary">Active</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Counsellor Detail */}
      {selected && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-on-surface">{selected.name}</h3>
            <button onClick={() => setSelected(null)} className="p-2 rounded-full hover:bg-surface-container">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-container-low rounded-xl p-4"><p className="text-xs text-on-surface-variant">Email</p><p className="text-sm font-semibold">{selected.email || "—"}</p></div>
            <div className="bg-surface-container-low rounded-xl p-4"><p className="text-xs text-on-surface-variant">Faculty</p><p className="text-sm font-semibold">{selected.faculty || "Not specified"}</p></div>
            <div className="bg-surface-container-low rounded-xl p-4"><p className="text-xs text-on-surface-variant">Last Active</p><p className="text-sm font-semibold">{selected.lastActive !== "Never" ? new Date(selected.lastActive).toLocaleDateString() : "Never"}</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
