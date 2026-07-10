"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { useTranslation } from "../lib/i18n";

export default function CounsellorSidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    { href: "/counsellor", label: t("sidebar.counsellor.dashboard"), icon: "dashboard" },
    { href: "/counsellor/students", label: t("sidebar.counsellor.students"), icon: "groups" },
    { href: "/counsellor/chat", label: t("sidebar.counsellor.chat"), icon: "forum" },
    { href: "/counsellor/media", label: t("sidebar.counsellor.media"), icon: "play_circle" },
    { href: "/counsellor/library", label: t("sidebar.counsellor.library"), icon: "local_library" },
    { href: "/counsellor/analytics", label: t("sidebar.counsellor.analytics"), icon: "monitoring" },
    { href: "/counsellor/research", label: "Research", icon: "science" },
  ];

  const bottomItems = navItems.slice(0, 4);
  const moreItems = navItems.slice(4);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col h-full p-3 border-r border-outline-variant bg-surface-container-low w-64 shrink-0">
        <div className="flex items-center gap-3 px-3 py-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined icon-fill">person</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-primary leading-tight">{t("sidebar.counsellor.title")}</h2>
            <p className="text-xs text-on-surface-variant">{t("sidebar.counsellor.subtitle")}</p>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/counsellor" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive ? "bg-primary-container text-on-primary-container font-bold shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high"
                )}
              >
                <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-4 border-t border-outline-variant flex flex-col gap-1">
          <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">settings</span>
            {t("sidebar.counsellor.settings")}
          </Link>
          <Link href="/crisis" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">help_outline</span>
            {t("sidebar.counsellor.help")}
          </Link>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-outline-variant flex items-center justify-around px-1 py-1" style={{ paddingBottom: "env(safe-area-inset-bottom, 4px)" }}>
        {bottomItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/counsellor" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={clsx(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors min-w-0 flex-1",
                isActive ? "text-primary" : "text-on-surface-variant"
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

      {/* More drawer */}
      {drawerOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest rounded-t-2xl border-t border-outline-variant shadow-xl animate-slide-in" style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
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
                        isActive ? "bg-primary-container text-on-primary-container" : "text-on-surface hover:bg-surface-container"
                      )}
                    >
                      <span className="material-symbols-outlined text-[22px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                <Link href="/settings" onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px]">settings</span>
                  <span>{t("sidebar.counsellor.settings")}</span>
                </Link>
                <Link href="/crisis" onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px]">help_outline</span>
                  <span>{t("sidebar.counsellor.help")}</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
