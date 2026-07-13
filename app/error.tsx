"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-6">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="bg-blob-1" />
        <div className="bg-blob-2" />
      </div>
      <div className="relative z-10 max-w-md w-full bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-sm text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[32px] text-error">
            error_outline
          </span>
        </div>
        <h1 className="text-2xl font-bold text-on-surface mb-2">
          Something went wrong
        </h1>
        <p className="text-on-surface-variant text-sm mb-2">
          {error.message || "An unexpected error occurred."}
        </p>
        <p className="text-xs text-on-surface-variant/70 mb-6">
          Take a moment — you can try again whenever you&apos;re ready.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-primary text-on-primary font-semibold rounded-xl shadow-sm hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
