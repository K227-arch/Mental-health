"use client";

import { useState, useEffect, useRef } from "react";
import { insforge } from "@/lib/insforge";
import { getLang, type Lang } from "@/app/lib/i18n";

const LANGUAGES: { code: Lang; label: string; flag: string; native: string }[] = [
  { code: "en",  label: "English",    flag: "🇬🇧", native: "English"    },
  { code: "rny", label: "Runyankore", flag: "🇺🇬", native: "Runyankore"  },
  { code: "lg",  label: "Luganda",    flag: "🇺🇬", native: "Luganda"    },
  { code: "sw",  label: "Swahili",    flag: "🇹🇿", native: "Kiswahili"  },
];

interface Props {
  /** compact = icon only (for tight navbars), full = flag + label */
  compact?: boolean;
}

export default function LanguageSwitcher({ compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Lang>("en");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrent(getLang());
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = async (lang: Lang) => {
    setCurrent(lang);
    setOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("mindcare_lang", lang);
      // Broadcast so any component using getLang() can re-read
      window.dispatchEvent(new CustomEvent("mindcare_lang_change", { detail: lang }));
    }
    // Persist to DB for authenticated users
    try {
      const { data } = await insforge.auth.getCurrentUser();
      if (data?.user) {
        await insforge.database
          .from("student_profiles")
          .update({ language_preference: lang, updated_at: new Date().toISOString() })
          .eq("id", data.user.id);
      }
    } catch { /* silent — user may not be authenticated */ }
  };

  const active = LANGUAGES.find(l => l.code === current) ?? LANGUAGES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container border border-transparent hover:border-outline-variant/30 transition-colors"
        aria-label={`Language: ${active.label}`}
        title="Switch language"
      >
        <span className="text-base leading-none select-none">{active.flag}</span>
        {!compact && (
          <span className="text-xs font-semibold hidden md:inline">{active.label}</span>
        )}
        <span
          className="material-symbols-outlined text-[14px] transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl overflow-hidden z-[60] animate-fade-in">
          <div className="p-1.5">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => select(lang.code)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  current === lang.code
                    ? "bg-primary-container text-on-primary-container font-semibold"
                    : "text-on-surface hover:bg-surface-container"
                }`}
              >
                <span className="text-lg select-none">{lang.flag}</span>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-medium leading-tight">{lang.label}</p>
                  <p className="text-[10px] opacity-60">{lang.native}</p>
                </div>
                {current === lang.code && (
                  <span className="material-symbols-outlined icon-fill text-[16px] shrink-0">
                    check_circle
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
