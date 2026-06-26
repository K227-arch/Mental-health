"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { insforge } from "@/lib/insforge";
import type { Notification } from "@/lib/insforge";

const TYPE_CONFIG: Record<string, { icon: string; bg: string; text: string; border: string }> = {
  critical: { icon: "emergency", bg: "bg-error-container", text: "text-error", border: "border-error-container" },
  warning:  { icon: "warning",   bg: "bg-primary-fixed/30", text: "text-primary", border: "border-primary-fixed-dim" },
  info:     { icon: "notifications", bg: "bg-secondary-container/30", text: "text-secondary", border: "border-secondary-fixed-dim" },
};

function timeAgo(ts: string) {
  const d = Date.now() - new Date(ts).getTime();
  if (d < 60000) return "just now";
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  if (d < 604800000) return `${Math.floor(d / 86400000)}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function NotificationsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "critical">("all");
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async (uid: string) => {
    const { data } = await insforge.database
      .from("notifications")
      .select()
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setNotifications(data as Notification[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    insforge.auth.getCurrentUser().then(({ data }) => {
      if (data?.user) {
        setUserId(data.user.id);
        load(data.user.id);
      } else {
        setLoading(false);
      }
    });
  }, [load]);

  // Real-time — new notifications appear instantly
  useEffect(() => {
    if (!userId) return;
    let cleanup = false;
    const channel = `notifications:${userId}`;
    (async () => {
      await insforge.realtime.connect();
      const sub = await insforge.realtime.subscribe(channel);
      if (sub.ok && !cleanup) {
        insforge.realtime.on("new_notification", () => {
          if (!cleanup) load(userId);
        });
      }
    })();
    return () => {
      cleanup = true;
      insforge.realtime.unsubscribe(channel);
    };
  }, [userId, load]);

  const markRead = async (id: string) => {
    await insforge.database.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!userId) return;
    setMarkingAll(true);
    await insforge.database.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setMarkingAll(false);
  };

  const deleteNotif = async (id: string) => {
    await insforge.database.from("notifications").delete().eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.is_read;
    if (filter === "critical") return n.type === "critical";
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar variant="student" />
      <main className="flex-1 pt-16 px-4 md:px-20 py-8 max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-on-surface mb-1">Notifications</h1>
            <p className="text-sm text-on-surface-variant">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "All caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-primary border border-primary/30 rounded-xl hover:bg-primary-container/30 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">done_all</span>
              {markingAll ? "Marking…" : "Mark all read"}
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 bg-surface-container-low rounded-xl p-1.5 w-fit">
          {(["all", "unread", "critical"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-colors flex items-center gap-1.5 ${
                filter === tab
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab === "critical" && <span className="w-1.5 h-1.5 rounded-full bg-error" />}
              {tab === "unread" && unreadCount > 0 && (
                <span className="bg-primary text-on-primary text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-black">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-[56px] text-on-surface-variant/20 block mb-3">
              notifications_none
            </span>
            <p className="text-on-surface-variant font-medium">No notifications here</p>
            <p className="text-sm text-on-surface-variant/70 mt-1">
              {filter !== "all" ? "Try switching to 'All'" : "You're all caught up"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(n => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
              return (
                <div
                  key={n.id}
                  className={`flex gap-4 p-4 rounded-2xl border transition-all ${
                    !n.is_read
                      ? `${cfg.bg} ${cfg.border} shadow-sm`
                      : "bg-surface-container-lowest border-outline-variant/40 opacity-70"
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} border ${cfg.border}`}>
                    <span className={`material-symbols-outlined icon-fill text-[20px] ${cfg.text}`}>
                      {cfg.icon}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold leading-tight ${n.is_read ? "text-on-surface-variant" : "text-on-surface"}`}>
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{n.body}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-outline flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        {timeAgo(n.created_at)}
                      </span>
                      {!n.is_read && (
                        <button
                          onClick={() => markRead(n.id)}
                          className="text-[10px] text-primary font-semibold hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={() => markRead(n.id)}
                          className="text-[10px] text-secondary font-semibold hover:underline flex items-center gap-0.5"
                        >
                          Open
                          <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                        </Link>
                      )}
                      <button
                        onClick={() => deleteNotif(n.id)}
                        className="text-[10px] text-on-surface-variant/50 hover:text-error transition-colors ml-auto"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete_outline</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
