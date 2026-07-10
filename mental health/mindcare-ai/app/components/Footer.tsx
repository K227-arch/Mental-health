"use client";

import Link from "next/link";
import { useTranslation } from "../lib/i18n";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="w-full bg-tertiary-fixed py-12 px-6 md:px-20 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-outline-variant/30 mt-auto">
      <div className="flex flex-col md:flex-row items-center gap-2">
        <span className="flex items-center gap-2">
          <img src="/logo.jpeg" alt="Selfcare Hub" className="w-7 h-7 object-contain rounded-md" />
          <span className="font-bold text-xl text-primary">Selfcare Hub</span>
        </span>
        <span className="text-xs text-on-tertiary-fixed opacity-80">{t("footer.copyright")}</span>
      </div>
      <nav className="flex flex-wrap justify-center gap-6 text-xs text-on-tertiary-fixed">
        <Link href="/privacy" className="opacity-80 hover:opacity-100 transition-opacity">
          {t("footer.privacy")}
        </Link>
        <Link href="/terms" className="opacity-80 hover:opacity-100 transition-opacity">
          {t("footer.terms")}
        </Link>
      </nav>
    </footer>
  );
}
