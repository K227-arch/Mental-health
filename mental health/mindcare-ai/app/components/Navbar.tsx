"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import LanguageSwitcher from "./LanguageSwitcher";

interface NavbarProps {
  variant?: "student" | "counsellor";
}

export default function Navbar({ variant = "student" }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name?: string; email?: string; avatar_url?: string; id?: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => {
      if (!r.ok) return;
      return r.json().then((d) => {
        if (d?.user) {
          setUser(d.user);
          // Fetch notifications
          if (d.user.id) {
            fetchNotifications(d.user.id);
          }
        }
      });
    });
  }, []);

  const fetchNotifications = (userId: string) => {
    fetch(`/api/notifications?userId=${userId}`)
      .then((r) => r.ok ? r.json() : { notifications: [] })
      .then((data) => {
        let notifs = (data.notifications || []).filter((n: any) => !n.is_read);

        if (variant === "counsellor") {
          // Counsellor sees their own + system notifications
          fetch(`/api/notifications?userId=counsellor-system`)
            .then((r) => r.ok ? r.json() : { notifications: [] })
            .then((sysData) => {
              const sysNotifs = (sysData.notifications || []).filter((n: any) => !n.is_read);
              const combined = [...sysNotifs, ...notifs];
              // Deduplicate by ID
              const unique = combined.filter((n, i, arr) => arr.findIndex((x) => x.id === n.id) === i);
              setNotifications(unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            })
            .catch(() => setNotifications(notifs));
        } else {
          // Student sees only their own notifications
          setNotifications(notifs);
        }
      })
      .catch(() => {});
  };

  // Poll notifications every 10 seconds
  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => fetchNotifications(user.id!), 10000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    await fetch("/api/auth/sign-out", { method: "POST" });
    setUser(null);
    setDropdownOpen(false);
    router.push("/auth/sign-in");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "";

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-surface border-b border-surface-variant shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-1 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.jpeg" alt="Selfcare Hub" className="w-8 h-8 object-contain rounded-lg" />
            <span className="font-bold text-2xl text-primary tracking-tight">Selfcare Hub</span>
          </Link>
        </div>

        {/* Desktop Nav Links - Student only */}
        {variant === "student" && (
          <nav className="hidden md:flex items-center gap-1">
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-px bg-outline-variant mx-1" />

          <LanguageSwitcher variant="light" />

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors relative"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-error text-on-error text-[9px] font-bold rounded-full flex items-center justify-center">
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg animate-fade-in overflow-hidden z-50">
                <div className="p-3 border-b border-outline-variant flex items-center justify-between">
                  <span className="text-sm font-semibold text-on-surface">Notifications</span>
                  {notifications.length > 0 && (
                    <span className="text-xs text-primary font-medium">{notifications.length} new</span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-on-surface-variant text-sm">
                      <span className="material-symbols-outlined text-[28px] opacity-30 block mb-2">notifications_none</span>
                      No new notifications
                    </div>
                  ) : (
                    notifications.slice(0, 8).map((notif, i) => (
                      <Link
                        key={`${notif.id}-${i}`}
                        href={notif.link || "/dashboard"}
                        onClick={() => {
                          setNotifOpen(false);
                          // Mark as read
                          fetch("/api/notifications", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ notificationId: notif.id }),
                          }).then(() => {
                            setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
                          });
                        }}
                        className="flex items-start gap-3 px-3 py-3 hover:bg-surface-container transition-colors border-b border-outline-variant/20"
                      >
                        <span className={`material-symbols-outlined text-[18px] mt-0.5 shrink-0 ${
                          notif.type === "alert" ? "text-error" : notif.type === "message" ? "text-primary" : "text-secondary"
                        }`}>
                          {notif.type === "alert" ? "warning" : notif.type === "message" ? "chat" : "info"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-on-surface truncate">{notif.title}</p>
                          <p className="text-xs text-on-surface-variant truncate">{notif.body}</p>
                          <p className="text-[10px] text-on-surface-variant/60 mt-1">
                            {new Date(notif.created_at).toLocaleString()}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-full text-primary hover:bg-surface-container transition-colors border-2 border-primary/20 overflow-hidden"
              aria-label="Profile"
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : initials ? (
                <span className="text-xs font-semibold">{initials}</span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">person</span>
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg animate-fade-in overflow-hidden">
                {user ? (
                  <div className="p-4 border-b border-outline-variant">
                    <p className="text-sm font-semibold text-on-surface truncate">{user.name || user.email || "Loading..."}</p>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">{user.email}</p>
                  </div>
                ) : (
                  <div className="p-4 border-b border-outline-variant">
                    <div className="h-4 w-24 bg-surface-container rounded animate-pulse mb-2" />
                    <div className="h-3 w-32 bg-surface-container rounded animate-pulse" />
                  </div>
                )}
                <div className="p-1">
                  <Link
                    href={variant === "counsellor" ? "/counsellor" : "/dashboard"}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-on-surface hover:bg-surface-container rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">person</span>
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-on-surface hover:bg-surface-container rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                    Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error-container/50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    {signingOut ? "Signing out..." : "Sign Out"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-surface border-b border-outline-variant shadow-lg md:hidden animate-fade-in">
          <nav className="flex flex-col p-3 gap-1">
            {(
              variant === "student"
                ? [
                    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
                    { href: "/screening", label: "Screening", icon: "psychology" },
                    { href: "/wellness", label: "Wellness Journey", icon: "self_improvement" },
                    { href: "/crisis", label: "Crisis Support", icon: "emergency", red: true },
                  ]
                : [
                    { href: "/counsellor", label: "Dashboard", icon: "dashboard" },
                    { href: "/counsellor/analytics", label: "Analytics", icon: "monitoring" },
                    { href: "/counsellor/chat", label: "Chat", icon: "forum" },
                    { href: "/counsellor/library", label: "Library", icon: "library_books" },
                  ]
            ).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
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
          </nav>
        </div>
      )}
    </>
  );
}
