"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation, languages } from "../lib/i18n";

export default function LanguageSwitcher({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { lang, setLang, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isDark = variant === "dark";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          isDark
            ? "text-white/60 hover:text-white hover:bg-white/5 border border-white/10"
            : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-outline-variant/40"
        }`}
        aria-label={t("language.label")}
      >
        <span className="material-symbols-outlined text-[16px]">language</span>
        <span className="hidden sm:inline">{currentLang.nativeLabel}</span>
        <span className="material-symbols-outlined text-[14px]">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open && (
        <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl border overflow-hidden z-50 animate-fade-in ${
          isDark
            ? "bg-[#1a1f2e] border-white/10"
            : "bg-surface-container-lowest border-outline-variant"
        }`}>
          <div className={`px-3 py-2 border-b ${isDark ? "border-white/5" : "border-outline-variant/30"}`}>
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-white/40" : "text-on-surface-variant"}`}>
              {t("language.label")}
            </span>
          </div>
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                l.code === lang
                  ? isDark
                    ? "bg-white/5 text-cyan-400"
                    : "bg-primary-container/50 text-primary"
                  : isDark
                  ? "text-white/70 hover:bg-white/5 hover:text-white"
                  : "text-on-surface hover:bg-surface-container"
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{l.nativeLabel}</span>
                <span className={`text-xs ${isDark ? "text-white/30" : "text-on-surface-variant"}`}>
                  {l.label}
                </span>
              </div>
              {l.code === lang && (
                <span className={`material-symbols-outlined text-[16px] ${isDark ? "text-cyan-400" : "text-primary"}`}>
                  check
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
