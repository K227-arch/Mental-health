"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import NotificationBell from "./NotificationBell";

interface NavbarProps {
  variant?: "student" | "counsellor";
}

const STUDENT_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/screening", label: "Screening", icon: "psychology" },
  { href: "/wellness", label: "Wellness", icon: "self_improvement" },
  { href: "/messages", label: "Messages", icon: "chat" },
  { href: "/crisis", label: "Crisis", icon: "emergency", red: true },
];
export default function Navbar({ variant = "student" }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{
    id?: string;
    name?: string | null;
    email?: string;
    avatar_url?: string | null;
    role?: string;
  } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load the current user from our API route (which reads server cookies)
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.user) setUser(d.user); })
      .catch(() => {});
  }, [pathname]); // re-check on route change

  // Close dropdown on outside click
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    setDropdownOpen(false);
    await fetch("/api/auth/sign-out", { method: "POST" });
    setUser(null);
    router.push("/auth/sign-in");
    router.refresh();
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-surface border-b border-surface-variant shadow-sm">
        {/* Logo + mobile menu */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-1 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">
              {mobileOpen ? "close" : "menu"}
            </span>
          </button>
          <Link href="/" className="font-black text-2xl text-primary tracking-tight">
            MindCare AI
          </Link>
        </div>

        {/* Desktop nav — student only */}
        {variant === "student" && (
          <nav className="hidden md:flex items-center gap-1">
            {STUDENT_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  item.red
                    ? "text-error hover:bg-error-container/50"
                    : pathname === item.href
                    ? "bg-primary-container text-on-primary-container"
                    : "text-on-surface-variant hover:bg-surface-container"
                )}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Emergency — always visible */}
          <Link
            href="/crisis"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-error text-sm font-medium hover:bg-error-container/50 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined icon-fill text-[18px]">
              medical_services
            </span>
            <span className="hidden md:inline">Emergency</span>
          </Link>

          <div className="h-5 w-px bg-outline-variant mx-1 hidden sm:block" />

          {/* Language stub */}
          <button
            className="w-9 h-9 hidden sm:flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
            aria-label="Language"
          >
            <span className="material-symbols-outlined">language</span>
          </button>

          {/* Notification bell — only for authenticated users */}
          {user?.id && <NotificationBell userId={user.id} />}

          {/* User avatar / dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-full text-primary hover:bg-surface-container transition-colors border-2 border-primary/20 overflow-hidden"
              aria-label="Profile"
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold">{initials}</span>
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl animate-fade-in overflow-hidden z-50">
                {user ? (
                  <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low">
                    <p className="text-sm font-semibold text-on-surface truncate">
                      {user.name || "User"}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">
                      {user.email}
                    </p>
                    {user.role && (
                      <span className="inline-flex items-center mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container font-semibold uppercase tracking-wider">
                        {user.role}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-3 border-b border-outline-variant">
                    <div className="h-3 w-24 bg-surface-container rounded animate-pulse mb-1.5" />
                    <div className="h-2.5 w-32 bg-surface-container rounded animate-pulse" />
                  </div>
                )}

                <div className="p-1.5">
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-on-surface hover:bg-surface-container rounded-xl transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                    Profile & Settings
                  </Link>

                  {user?.role === "counsellor" ? (
                    <Link
                      href="/counsellor"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-on-surface hover:bg-surface-container rounded-xl transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">dashboard</span>
                      Counsellor Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm text-on-surface hover:bg-surface-container rounded-xl transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">dashboard</span>
                        My Dashboard
                      </Link>
                      <Link
                        href="/notifications"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm text-on-surface hover:bg-surface-container rounded-xl transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">notifications</span>
                        All Notifications
                      </Link>
                      <Link
                        href="/safety-plan"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm text-on-surface hover:bg-surface-container rounded-xl transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">health_and_safety</span>
                        Safety Plan
                      </Link>
                      <Link
                        href="/schedule"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm text-on-surface hover:bg-surface-container rounded-xl transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                        Schedule Session
                      </Link>
                    </>
                  )}

                  <div className="my-1 border-t border-outline-variant/50" />

                  {user ? (
                    <button
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-error hover:bg-error-container/50 rounded-xl transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        logout
                      </span>
                      {signingOut ? "Signing out…" : "Sign Out"}
                    </button>
                  ) : (
                    <Link
                      href="/auth/sign-in"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-primary font-semibold hover:bg-primary-container/30 rounded-xl transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        login
                      </span>
                      Sign In
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile slide-down menu */}
      {mobileOpen && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-surface border-b border-outline-variant shadow-lg md:hidden animate-fade-in">
          <nav className="flex flex-col p-3 gap-1">
            {(
              variant === "student"
                ? [
                    ...STUDENT_NAV,
                    { href: "/notifications", label: "Notifications", icon: "notifications" },
                    { href: "/safety-plan", label: "Safety Plan", icon: "health_and_safety" },
                    { href: "/schedule", label: "Schedule Session", icon: "calendar_month" },
                  ]
                : [
                    { href: "/counsellor", label: "Dashboard", icon: "dashboard" },
                    { href: "/counsellor/chat", label: "Chat", icon: "forum" },
                    { href: "/counsellor/library", label: "Library", icon: "local_library" },
                    { href: "/counsellor/analytics", label: "Analytics", icon: "monitoring" },
                    { href: "/schedule", label: "Schedule Session", icon: "calendar_month" },
                  ]
            ).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  (item as any).red
                    ? "text-error hover:bg-error-container/50"
                    : pathname === item.href
                    ? "bg-primary-container text-on-primary-container"
                    : "text-on-surface-variant hover:bg-surface-container"
                )}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </Link>
            ))}

            {user && (
              <>
                <div className="my-1 border-t border-outline-variant mx-3" />
                <button
                  onClick={() => { setMobileOpen(false); handleSignOut(); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-error hover:bg-error-container/50 transition-colors"
                >
                  <span className="material-symbols-outlined">logout</span>
                  Sign Out
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
