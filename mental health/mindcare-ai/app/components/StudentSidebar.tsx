"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/screening", label: "Daily Check-in", icon: "psychology" },
  { href: "/wellness", label: "Wellness Hub", icon: "self_improvement" },
  { href: "/dashboard/chat", label: "Chat", icon: "forum" },
  { href: "/settings", label: "Settings", icon: "settings" },
  { href: "/dashboard/crisis", label: "Crisis Support", icon: "emergency", red: true },
];

export default function StudentSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col h-[calc(100vh-64px)] sticky top-16 w-60 shrink-0 p-3 border-r border-outline-variant bg-surface-container-low overflow-y-auto">
      <div className="mb-4 px-3">
        <h2 className="text-xs text-on-surface-variant uppercase tracking-wider mb-1 mt-3">Student Portal</h2>
        <p className="text-sm font-semibold text-on-surface">My Wellness</p>
      </div>
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? item.red
                    ? "bg-error-container text-on-error-container font-bold shadow-sm"
                    : "bg-primary-container text-on-primary-container font-bold shadow-sm"
                  : item.red
                  ? "text-error hover:bg-error-container/30"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="mt-auto pt-4 border-t border-outline-variant">
        <Link
          href="/crisis"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined">help_outline</span>
          Help & Resources
        </Link>
      </div>
    </aside>
  );
}
