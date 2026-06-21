import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-6">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="bg-blob-1" />
        <div className="bg-blob-2" />
      </div>
      <div className="relative z-10 max-w-md w-full bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-sm text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[32px] text-secondary">
            search_off
          </span>
        </div>
        <h1 className="text-2xl font-bold text-on-surface mb-2">
          Page not found
        </h1>
        <p className="text-on-surface-variant text-sm mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          <br />
          Take a deep breath — we&apos;ll get you back on track.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-semibold rounded-xl shadow-sm hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">home</span>
          Go home
        </Link>
      </div>
    </div>
  );
}
