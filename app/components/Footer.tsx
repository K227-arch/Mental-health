import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-tertiary-fixed py-12 px-6 md:px-20 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-outline-variant/30 mt-auto">
      <div className="flex flex-col md:flex-row items-center gap-2">
        <span className="font-bold text-xl text-primary">MindCare AI</span>
        <span className="text-xs text-on-tertiary-fixed opacity-80">┬⌐ 2024 University Mental Health Support</span>
      </div>
      <nav className="flex flex-wrap justify-center gap-6 text-xs text-on-tertiary-fixed">
        <Link href="/privacy" className="opacity-80 hover:opacity-100 transition-opacity">
          Privacy Policy
        </Link>
        <Link href="/terms" className="opacity-80 hover:opacity-100 transition-opacity">
          Terms of Service
        </Link>
      </nav>
    </footer>
  );
}