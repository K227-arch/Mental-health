"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { insforge } from "@/lib/insforge";
import type { Notification } from "@/lib/insforge";

interface Props {
  userId: string;
}

export default function NotificationBell({ userId }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.is_read).length;

  const load = async () => {
    const { data } = await insforge.database
      .from("notifications")
      .select()
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(15);
    if (data) setNotifications(data as Notification[]);
  };

  useEffect(() => {
    load();

    // Close on outside click
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [userId]);

  // Real-time subscription for new notifications
  useEffect(() => {
    let cleanup = false;
    const channel = `notifications:${userId}`;

    (async () => {
      insforge.realtime.on("connect", () => {});
      await insforge.realtime.connect();
      const sub = await insforge.realtime.subscribe(channel);
      if (sub.ok && !cleanup) {
        insforge.realtime.on("new_notification", () => {
          if (!cleanup) load();
        });
      }
    })();

    return () => {
      cleanup = true;
      insforge.realtime.unsubscribe(channel);
    };
  }, [userId]);

  const markAllRead = async () => {
    await insforge.database
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    await insforge.database.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const timeAgo = (ts: string) => {
    const d = Date.now() - new Date(ts).getTime();
    if (d < 60000) return "just now";
    if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
    if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  const iconFor = (type: string) => {
    if (type === "critical") return { icon: "emergency", color: "text-error" };
    if (type === "warning") return { icon: "warning", color: "text-primary" };
    return { icon: "notifications", color: "text-secondary" };
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      >
        <span className="material-symbols-outlined text-[22px]">notifications</span>
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-error text-on-error text-[9px] font-black flex items-center justify-center leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl animate-fade-in overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface-container-low">
            <span className="text-sm font-bold text-on-surface">
              Notifications
              {unread > 0 && (
                <span className="ml-2 text-xs bg-error text-on-error rounded-full px-1.5 py-0.5">{unread}</span>
              )}
            </span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/30">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <span className="material-symbols-outlined text-[36px] text-on-surface-variant/30 block mb-2">
                  notifications_none
                </span>
                <p className="text-xs text-on-surface-variant">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const ic = iconFor(n.type);
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-surface-container transition-colors ${
                      !n.is_read ? "bg-primary-fixed/10" : ""
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      n.type === "critical" ? "bg-error-container" : "bg-surface-container"
                    }`}>
                      <span className={`material-symbols-outlined text-[18px] ${ic.color}`}>{ic.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold leading-tight mb-0.5 ${n.is_read ? "text-on-surface-variant" : "text-on-surface"}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-on-surface-variant truncate">{n.body}</p>
                      <p className="text-[10px] text-outline mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-outline-variant p-2">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1 py-2 text-xs text-primary font-semibold hover:bg-surface-container rounded-xl transition-colors"
              >
                View all
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
