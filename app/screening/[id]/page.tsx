"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { insforge, getSeverity, generateXAI } from "@/lib/insforge";
import type { ScreeningResult } from "@/lib/insforge";

const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things?",
  "Feeling down, depressed, or hopeless?",
  "Trouble falling or staying asleep, or sleeping too much?",
  "Feeling tired or having little energy?",
  "Poor appetite or overeating?",
  "Feeling bad about yourself — or that you are a failure?",
  "Trouble concentrating on things?",
  "Moving or speaking unusually slowly, or being fidgety?",
  "Thoughts that you would be better off dead, or of hurting yourself?",
];

const OPTIONS = ["Not at all", "Several days", "More than half the days", "Nearly every day"];

export default function ScreeningDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: user } = await insforge.auth.getCurrentUser();
      if (!user?.user) { router.push("/auth/sign-in"); return; }

      const { data } = await insforge.database
        .from("screening_results")
        .select()
        .eq("id", id)
        .eq("user_id", user.user.id)
        .maybeSingle();

      if (!data) { setNotFound(true); }
      else { setResult(data as ScreeningResult); }
      setLoading(false);
    })();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (notFound || !result) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center flex-col gap-4">
        <span className="material-symbols-outlined text-[56px] text-on-surface-variant/30">search_off</span>
        <p className="text-on-surface-variant">Screening result not found.</p>
        <Link href="/dashboard" className="text-primary font-semibold hover:underline">← Back to Dashboard</Link>
      </div>
    );
  }

  const sev = getSeverity(result.score);
  const xai = generateXAI(result.responses || {}, result.score);

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar variant="student" />
      <main className="flex-1 pt-16 px-4 md:px-20 py-8 max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard" className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Screening Detail</h1>
            <p className="text-xs text-on-surface-variant">
              {new Date(result.created_at).toLocaleDateString("en", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>

        {/* Score summary */}
        <div className={`rounded-2xl p-6 mb-6 border flex items-center gap-6 shadow-sm ${
          sev.risk === "Critical" ? "bg-error-container/20 border-error-container" :
          sev.risk === "High" ? "bg-primary-fixed/20 border-primary-fixed-dim" :
          sev.risk === "Moderate" ? "bg-primary-container/20 border-primary-fixed-dim" :
          "bg-secondary-container/20 border-secondary-fixed-dim"
        }`}>
          <div className="text-center">
            <div className="text-5xl font-black text-primary">{result.score}</div>
            <div className="text-xs text-on-surface-variant mt-1">/ 27</div>
          </div>
          <div className="flex-1">
            <p className={`text-xl font-bold ${sev.color} mb-1`}>{sev.label}</p>
            <p className="text-sm text-on-surface-variant mb-2">{xai.summary}</p>
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                sev.risk === "Critical" ? "bg-error text-on-error" :
                sev.risk === "High" ? "bg-error-container text-on-error-container" :
                sev.risk === "Moderate" ? "bg-primary-container text-on-primary-container" :
                "bg-secondary-container text-on-secondary-container"
              }`}>
                {sev.risk} Risk
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant">
                Confidence: {xai.confidence}%
              </span>
            </div>
          </div>
        </div>

        {/* Flagged keywords banner */}
        {result.flagged_keywords && result.flagged_keywords.length > 0 && (
          <div className="bg-error-container/30 border border-error-container rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="material-symbols-outlined icon-fill text-error text-[22px] shrink-0">flag</span>
            <div>
              <p className="text-sm font-bold text-error mb-1">Crisis keywords detected</p>
              <p className="text-xs text-on-surface-variant">
                Keywords: <strong>{result.flagged_keywords.join(", ")}</strong>.
                Your counsellor was notified.
              </p>
            </div>
          </div>
        )}

        {/* Per-question breakdown */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-base font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">quiz</span>
            Question-by-Question Breakdown
          </h2>
          <div className="space-y-3">
            {xai.markers.map((m, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${
                m.flag ? "bg-error-container/15 border-error-container/50" :
                m.score >= 2 ? "bg-primary-fixed/15 border-primary-fixed-dim" :
                "bg-surface-container border-outline-variant/30"
              }`}>
                {/* Score badge */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                  m.score === 0 ? "bg-secondary-container text-on-secondary-container" :
                  m.score === 1 ? "bg-surface-container-highest text-on-surface" :
                  m.score === 2 ? "bg-primary-container text-on-primary-container" :
                  "bg-error-container text-on-error-container"
                }`}>
                  {m.score}
                </div>
                {/* Bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-on-surface">Q{i + 1}: {m.question}</p>
                    {m.flag && (
                      <span className="material-symbols-outlined icon-fill text-error text-[16px] shrink-0">flag</span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant mb-1.5">{m.answer}</p>
                  {/* Visual bar */}
                  <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        m.score === 0 ? "bg-secondary w-[0%]" :
                        m.score === 1 ? "bg-secondary w-[33%]" :
                        m.score === 2 ? "bg-primary w-[66%]" :
                        "bg-error w-full"
                      }`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dominant symptoms */}
        {xai.dominantSymptoms.length > 0 && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 mb-6 shadow-sm">
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">psychology</span>
              Dominant Symptoms
            </h3>
            <div className="flex flex-wrap gap-2">
              {xai.dominantSymptoms.map(s => (
                <span key={s} className="px-3 py-1.5 bg-primary-container text-on-primary-container text-xs font-semibold rounded-full capitalize">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/screening" className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-primary text-on-primary font-semibold rounded-xl hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Take New Check-in
          </Link>
          {result.score >= 10 && (
            <Link href="/messages" className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-secondary-container text-on-secondary-container font-semibold rounded-xl hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-[18px]">chat</span>
              Talk to Counsellor
            </Link>
          )}
          {result.score >= 15 && (
            <Link href="/crisis" className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-error text-on-error font-semibold rounded-xl hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-[18px]">emergency</span>
              Crisis Support
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
