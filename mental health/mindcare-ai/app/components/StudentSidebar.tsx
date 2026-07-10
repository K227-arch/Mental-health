"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { useTranslation } from "../lib/i18n";

export default function StudentSidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: t("sidebar.student.dashboard"), icon: "dashboard" },
    { href: "/screening", label: t("sidebar.student.checkin"), icon: "psychology" },
    { href: "/wellness", label: t("sidebar.student.wellness"), icon: "self_improvement" },
    { href: "/dashboard/chat", label: t("sidebar.student.chat"), icon: "forum" },
    { href: "/settings", label: t("sidebar.student.settings"), icon: "settings" },
    { href: "/dashboard/crisis", label: t("sidebar.student.crisis"), icon: "emergency", red: true },
  ];

  // Bottom nav shows first 4 + "More"
  const bottomItems = navItems.slice(0, 4);
  const moreItems = navItems.slice(4);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col h-[calc(100svh-64px)] sticky top-16 w-60 shrink-0 p-3 border-r border-outline-variant bg-surface-container-low overflow-y-auto">
        <div className="mb-4 px-3">
          <h2 className="text-xs text-on-surface-variant uppercase tracking-wider mb-1 mt-3">{t("sidebar.student.title")}</h2>
          <p className="text-sm font-semibold text-on-surface">{t("sidebar.student.subtitle")}</p>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? item.red ? "bg-error-container text-on-error-container font-bold shadow-sm" : "bg-primary-container text-on-primary-container font-bold shadow-sm"
                    : item.red ? "text-error hover:bg-error-container/30" : "text-on-surface-variant hover:bg-surface-container-high"
                )}
              >
                <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-4 border-t border-outline-variant">
          <Link href="/crisis" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">help_outline</span>
            {t("sidebar.student.help")}
          </Link>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-outline-variant flex items-center justify-around px-1 py-1" style={{ paddingBottom: "env(safe-area-inset-bottom, 4px)" }}>
        {bottomItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={clsx(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors min-w-0 flex-1",
                isActive ? item.red ? "text-error" : "text-primary" : "text-on-surface-variant"
              )}
            >
              <span className="material-symbols-outlined text-[22px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
              <span className="text-[9px] font-medium truncate w-full text-center leading-tight">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={clsx(
            "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors min-w-0 flex-1",
            drawerOpen ? "text-primary" : "text-on-surface-variant"
          )}
        >
          <span className="material-symbols-outlined text-[22px]">more_horiz</span>
          <span className="text-[9px] font-medium text-center leading-tight">More</span>
        </button>
      </nav>

      {/* More drawer overlay */}
      {drawerOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest rounded-t-2xl border-t border-outline-variant shadow-xl animate-slide-in" style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-outline-variant rounded-full" />
            </div>
            <div className="px-4 pb-2">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">More</p>
              <div className="flex flex-col gap-1">
                {moreItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href);
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setDrawerOpen(false)}
                      className={clsx(
                        "flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors",
                        isActive
                          ? item.red ? "bg-error-container text-on-error-container" : "bg-primary-container text-on-primary-container"
                          : item.red ? "text-error hover:bg-error-container/30" : "text-on-surface hover:bg-surface-container"
                      )}
                    >
                      <span className="material-symbols-outlined text-[22px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                <Link href="/crisis" onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px]">help_outline</span>
                  <span>{t("sidebar.student.help")}</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
