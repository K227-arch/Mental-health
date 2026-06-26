"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import clsx from "clsx";
import { insforge } from "@/lib/insforge";

const NAV = [
  { href: "/counsellor", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/counsellor/chat", label: "Chat", icon: "forum" },
  { href: "/counsellor/library", label: "Resource Library", icon: "local_library" },
  { href: "/counsellor/analytics", label: "Analytics", icon: "monitoring" },
];

export default function CounsellorSidebar() {
  const pathname = usePathname();
  const [criticalCount, setCriticalCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    // Load critical alert count
    insforge.database
      .from("counsellor_sessions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .eq("risk_level", "Critical")
      .then(({ count }) => setCriticalCount(count ?? 0));

    // Load unread notifications count (proxy for unread messages)
    insforge.database
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", "counsellor")
      .eq("is_read", false)
      .then(({ count }) => setUnreadMessages(count ?? 0));
  }, []);

  // Real-time subscription for new session updates
  useEffect(() => {
    let cleanup = false;
    (async () => {
      await insforge.realtime.connect();
      const sub = await insforge.realtime.subscribe("counsellor-updates");
      if (sub.ok && !cleanup) {
        insforge.realtime.on("session_updated", () => {
          insforge.database
            .from("counsellor_sessions")
            .select("id", { count: "exact", head: true })
            .eq("status", "active")
            .eq("risk_level", "Critical")
            .then(({ count }) => { if (!cleanup) setCriticalCount(count ?? 0); });
        });
        insforge.realtime.on("new_notification", () => {
          insforge.database
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", "counsellor")
            .eq("is_read", false)
            .then(({ count }) => { if (!cleanup) setUnreadMessages(count ?? 0); });
        });
      }
    })();
    return () => {
      cleanup = true;
      insforge.realtime.unsubscribe("counsellor-updates");
    };
  }, []);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside className="hidden md:flex flex-col h-full p-3 border-r border-outline-variant bg-surface-container-low w-64 shrink-0">
      {/* Profile header */}
      <div className="flex items-center gap-3 px-3 py-4 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center shrink-0 relative">
          <span className="material-symbols-outlined icon-fill">support_agent</span>
          {criticalCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-error text-on-error text-[9px] font-black flex items-center justify-center">
              {criticalCount}
            </span>
          )}
        </div>
        <div>
          <h2 className="text-base font-black text-primary leading-tight">Counsellor Portal</h2>
          <p className="text-xs text-on-surface-variant">Case Management</p>
        </div>
      </div>

      {/* New Session CTA */}
      <Link
        href="/counsellor/new-session"
        className="mb-8 flex items-center justify-center gap-1 py-3 px-6 bg-primary text-on-primary rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        New Session
      </Link>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        {NAV.map((item) => {
          const active = isActive(item.href, item.exact);
          const badge = item.href === "/counsellor" && criticalCount > 0
            ? criticalCount
            : item.href === "/counsellor/chat" && unreadMessages > 0
            ? unreadMessages
            : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors relative",
                active
                  ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              <span
                className="material-symbols-outlined"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span className="w-5 h-5 rounded-full bg-error text-on-error text-[10px] font-black flex items-center justify-center shrink-0">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div className="mt-auto pt-4 border-t border-outline-variant flex flex-col gap-1">
        <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined">manage_accounts</span>
          Settings
        </Link>
        <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined">help_outline</span>
          Help
        </Link>
      </div>
    </aside>
  );
}
