"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";

const navItems = [
  { href: "/admin", label: "Overview", icon: "admin_panel_settings" },
  { href: "/admin/counsellors", label: "Counsellors", icon: "support_agent" },
  { href: "/admin/students", label: "All Students", icon: "groups" },
  { href: "/admin/alerts", label: "Pending Alerts", icon: "notifications_active" },
  { href: "/admin/analytics", label: "Analytics", icon: "monitoring" },
  { href: "/admin/reports", label: "Reports", icon: "description" },
];

// First four get their own slot in the bottom bar; the rest live behind "More".
const bottomItems = navItems.slice(0, 4);
const moreItems = navItems.slice(4);

export default function AdminSidebar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isItemActive = (href: string) =>
    pathname === href || (href !== "/admin" && pathname.startsWith(href));

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col h-full p-3 border-r border-outline-variant bg-surface-container-low w-64 shrink-0">
        <div className="flex items-center gap-3 px-3 py-4 mb-4">
          <img src="/logo.jpeg" alt="Selfcare Hub" className="w-10 h-10 object-contain rounded-lg shrink-0" />
          <div className="min-w-0">
            <h2 className="text-sm font-black text-primary leading-tight">Admin Portal</h2>
            <p className="text-xs text-on-surface-variant truncate">System Administrator</p>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = isItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                )}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-outline-variant flex items-center justify-around px-1 py-1"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 4px)" }}
      >
        {bottomItems.map((item) => {
          const isActive = isItemActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-xl transition-colors min-w-0 flex-1 min-h-[44px]",
                isActive ? "text-primary" : "text-on-surface-variant"
              )}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="text-[9px] font-medium truncate w-full text-center leading-tight">
                {item.label.split(" ")[0]}
              </span>
            </Link>
          );
        })}

        <button
          onClick={() => setDrawerOpen(true)}
          className={clsx(
            "flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-xl transition-colors min-w-0 flex-1 min-h-[44px]",
            drawerOpen ? "text-primary" : "text-on-surface-variant"
          )}
          aria-label="More admin sections"
        >
          <span className="material-symbols-outlined text-[22px]">more_horiz</span>
          <span className="text-[9px] font-medium text-center leading-tight">More</span>
        </button>
      </nav>

      {/* More drawer */}
      {drawerOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest rounded-t-2xl border-t border-outline-variant shadow-xl animate-slide-in"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-outline-variant rounded-full" />
            </div>
            <div className="px-4 pb-2">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">More</p>
              <div className="flex flex-col gap-1">
                {moreItems.map((item) => {
                  const isActive = isItemActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={clsx(
                        "flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary-container text-on-primary-container"
                          : "text-on-surface hover:bg-surface-container"
                      )}
                    >
                      <span
                        className="material-symbols-outlined text-[22px]"
                        style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
