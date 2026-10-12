"use client";

import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full bg-surface-container-low border-t border-outline-variant/30 py-4 px-6 md:px-10 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand + copyright */}
        <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
          <span className="flex items-center gap-2">
            <img src="/logo.jpeg" alt="Selfcare Hub" className="w-6 h-6 object-contain rounded-md" />
            <span className="font-bold text-sm text-primary">Selfcare Hub</span>
          </span>
          <span className="text-xs text-on-surface-variant">
            © {year} Kathay Technologies. All rights reserved.
          </span>
        </div>

        {/* Links */}
        <nav className="flex items-center gap-4 text-xs text-on-surface-variant">
          <Link href="/privacy" className="hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <span className="opacity-30">·</span>
          <Link href="/terms" className="hover:text-primary transition-colors">
            Terms of Service
          </Link>
          <span className="opacity-30">·</span>
          <span className="opacity-60">Kathay Technologies 2026</span>
        </nav>
      </div>
    </footer>
  );
}
