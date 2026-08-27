"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const FACULTIES = [
  "Computing & IT",
  "Engineering",
  "Science",
  "Business",
  "Arts & Humanities",
  "Education",
  "Law",
  "Medicine",
  "Social Sciences",
  "Other",
];

export default function CompleteProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id?: string; name?: string; email?: string } | null>(null);
  const [checking, setChecking] = useState(true);
  const [studentId, setStudentId] = useState("");
  const [faculty, setFaculty] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Must be signed in; if the profile is already complete, skip this page.
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.user) {
          router.replace("/auth/sign-in");
          return;
        }
        if (d.user.role !== "student") {
          router.replace("/counsellor");
          return;
        }
        if (d.user.profileComplete) {
          router.replace("/dashboard");
          return;
        }
        setUser(d.user);
        // Pre-fill any values that already exist.
        if (d.user.studentId) setStudentId(d.user.studentId);
        if (d.user.faculty) setFaculty(d.user.faculty);
        if (d.user.yearOfStudy) setYearOfStudy(String(d.user.yearOfStudy));
        if (d.user.consent) setConsent(true);
        setChecking(false);
      })
      .catch(() => router.replace("/auth/sign-in"));
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!studentId.trim()) {
      setError("Please enter your student ID.");
      return;
    }
    if (!faculty) {
      setError("Please select your faculty.");
      return;
    }
    if (!yearOfStudy) {
      setError("Please select your year of study.");
      return;
    }
    if (!consent) {
      setError("You must consent to participate before continuing.");
      return;
    }
    if (!user?.id) {
      setError("Session expired. Please sign in again.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: user.name,
          email: user.email,
          role: "student",
          studentId: studentId.trim(),
          faculty,
          yearOfStudy: parseInt(yearOfStudy),
          consent: true,
        }),
      });

      if (res.status === 403) {
        const body = await res.json().catch(() => ({}));
        document.cookie = "insforge_access_token=; path=/; max-age=0";
        await fetch("/api/auth/sign-out", { method: "POST" }).catch(() => {});
        setError(body.error || "This account has been suspended.");
        setSaving(false);
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Could not save your profile. Please try again.");
        setSaving(false);
        return;
      }

      router.replace("/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <span className="material-symbols-outlined animate-spin text-[28px] text-primary">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 sm:px-6 py-10 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="bg-blob-1" />
        <div className="bg-blob-2" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <img src="/logo.jpeg" alt="Selfcare Hub" className="w-14 h-14 object-contain rounded-xl mx-auto mb-3" />
          </Link>
          <h2 className="font-black text-xl text-primary">Selfcare Hub</h2>
          <p className="text-on-surface-variant text-xs font-medium uppercase tracking-widest mt-1.5">
            Student Portal
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-6 sm:p-7 shadow-lg shadow-primary/5">
          <h1 className="text-lg font-bold text-on-surface mb-1">Complete your profile</h1>
          <p className="text-xs text-on-surface-variant mb-6">
            Before you continue, we need a few details to set up your student account.
            {user?.email ? ` Signed in as ${user.email}.` : ""}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student ID */}
            <div>
              <label htmlFor="studentId" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wide">
                Student ID
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
                  <span className="material-symbols-outlined text-[18px]">badge</span>
                </span>
                <input
                  id="studentId"
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. 2100701234"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                />
              </div>
            </div>

            {/* Faculty + Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="faculty" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wide">
                  Faculty
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
                    <span className="material-symbols-outlined text-[18px]">school</span>
                  </span>
                  <select
                    id="faculty"
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all appearance-none"
                  >
                    <option value="">Select</option>
                    {FACULTIES.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="yearOfStudy" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wide">
                  Year
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  </span>
                  <select
                    id="yearOfStudy"
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all appearance-none"
                  >
                    <option value="">Select</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                    <option value="5">Year 5+</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Consent */}
            <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-4 space-y-2.5">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                The following information will be kept strictly confidential and used solely for research classification purposes. You are free to withdraw at any point if not comfortable continuing.
              </p>
              <div className="flex items-start gap-2.5">
                <input
                  id="consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/30 accent-primary"
                />
                <label htmlFor="consent" className="text-sm font-medium text-on-surface cursor-pointer leading-snug">
                  I consent to participate in this interview.
                </label>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-error-container/80 text-on-error-container text-sm rounded-xl animate-fade-in">
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !consent}
              className="w-full py-3 bg-primary text-on-primary font-semibold rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
              )}
              {saving ? "Saving..." : "Continue"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-on-surface-variant/50 mt-4">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-on-surface-variant">Terms</Link> and{" "}
          <Link href="/privacy" className="underline hover:text-on-surface-variant">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
