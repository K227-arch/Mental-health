"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { insforge } from "@/lib/insforge";

interface NavbarProps {
  variant?: "student" | "counsellor";
}

export default function Navbar({ variant = "student" }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name?: string; email?: string; avatar_url?: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    insforge.auth.getCurrentUser().then(({ data }) => {
      if (data?.user) {
        setUser({
          name: data.user.profile?.name,
          email: data.user.email,
          avatar_url: data.user.profile?.avatar_url,
        });
      }
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    await insforge.auth.signOut();
    router.push("/auth/sign-in");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "?";

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
          <Link href="/" className="font-bold text-2xl text-primary tracking-tight">
            MindCare AI
          </Link>
        </div>

        {/* Desktop Nav Links - Student only */}
        {variant === "student" && (
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
              { href: "/screening", label: "Screening", icon: "psychology" },
              { href: "/wellness", label: "Wellness", icon: "self_improvement" },
              { href: "/crisis", label: "Crisis Support", icon: "emergency", red: true },
            ].map((item) => (
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
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/crisis"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-error text-sm font-medium hover:bg-error-container/50 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined icon-fill text-[18px]">medical_services</span>
            Emergency Help
          </Link>

          {variant === "student" && (
            <button className="hidden md:flex items-center gap-1 px-3 py-1.5 text-on-surface-variant text-sm font-medium hover:bg-surface-container rounded-full transition-colors">
              <span className="material-symbols-outlined text-[18px]">visibility_off</span>
              Anonymous Mode
            </button>
          )}

          <div className="h-5 w-px bg-outline-variant mx-1" />

          <button
            className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
            aria-label="Language"
          >
            <span className="material-symbols-outlined">language</span>
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-full text-primary hover:bg-surface-container transition-colors border-2 border-primary/20 overflow-hidden"
              aria-label="Profile"
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-semibold">{initials}</span>
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg animate-fade-in overflow-hidden">
                {user ? (
                  <div className="p-4 border-b border-outline-variant">
                    <p className="text-sm font-semibold text-on-surface truncate">{user.name || "User"}</p>
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
                    href="/auth/sign-in"
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
