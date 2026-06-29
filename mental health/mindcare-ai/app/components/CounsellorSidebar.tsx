"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { href: "/counsellor", label: "Dashboard", icon: "dashboard" },
  { href: "/counsellor/chat", label: "Chat", icon: "forum" },
  { href: "/counsellor/media", label: "Student Media", icon: "play_circle" },
  { href: "/counsellor/library", label: "Wellness Library", icon: "local_library" },
  { href: "/counsellor/analytics", label: "Analytics", icon: "monitoring" },
];

export default function CounsellorSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col h-full p-3 border-r border-outline-variant bg-surface-container-low w-64 shrink-0">
      {/* Profile */}
      <div className="flex items-center gap-3 px-3 py-4 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined icon-fill">person</span>
        </div>
        <div>
          <h2 className="text-lg font-black text-primary leading-tight">Counselor Portal</h2>
          <p className="text-xs text-on-surface-variant">Case Management</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/counsellor" && pathname.startsWith(item.href));
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
      <div className="mt-auto pt-4 border-t border-outline-variant flex flex-col gap-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined">settings</span>
          Settings
        </Link>
        <Link
          href="/crisis"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined">help_outline</span>
          Help
        </Link>
      </div>
    </aside>
  );
}
