export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="bg-blob-1" />
        <div className="bg-blob-2" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-primary-container/30 flex items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-[40px] text-primary">
            progress_activity
          </span>
        </div>
        <p className="text-on-surface-variant text-sm font-medium animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}
