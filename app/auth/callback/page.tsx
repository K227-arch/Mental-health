"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("insforge_code");
    const status = searchParams.get("insforge_status");
    const type = searchParams.get("insforge_type");
    const errorMsg = searchParams.get("insforge_error");

    if (code) {
      window.location.href = `/api/auth/callback?insforge_code=${code}`;
      return;
    }

    if (status === "success" && type === "verify_email") {
      router.replace("/auth/sign-in?verified=true");
      return;
    }

    if (status === "error" || errorMsg) {
      router.replace(`/auth/sign-in?error=${encodeURIComponent(errorMsg || "Authentication failed")}`);
      return;
    }

    router.replace("/auth/sign-in");
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <span className="material-symbols-outlined text-primary animate-spin text-[40px]">progress_activity</span>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <span className="material-symbols-outlined text-primary animate-spin text-[40px]">progress_activity</span>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
