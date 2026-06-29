"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { insforge } from "@/lib/insforge";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") === "counsellor" ? "counsellor" : "student";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    if (errorParam) setError(errorParam);
    if (params.get("reset") === "success") {
      setError(null);
      setResetSent(true);
    }
  }, []);

  const getRedirect = () => {
    if (typeof window === "undefined") return role === "counsellor" ? "/counsellor" : "/dashboard";
    return new URLSearchParams(window.location.search).get("redirect") || (role === "counsellor" ? "/counsellor" : "/dashboard");
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setResetLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send reset email");
      } else {
        setResetSent(true);
        setResetMode(false);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, redirect: getRedirect() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Sign in failed");
        setLoading(false);
        return;
      }

      router.push(data.redirect || "/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: string) => {
    setError(null);
    setOauthLoading(provider);
    const redirect = getRedirect();
    document.cookie = `insforge_redirect=${redirect}; path=/; max-age=600; SameSite=Lax`;
    const { data, error } = await insforge.auth.signInWithOAuth(provider as any, {
      redirectTo: `${window.location.origin}/api/auth/callback`,
      skipBrowserRedirect: true,
    });
    if (error) {
      setError(error.message);
      setOauthLoading(null);
      return;
    }
    if (data?.url) {
      if (data.codeVerifier) {
        document.cookie = `insforge_code_verifier=${data.codeVerifier}; path=/; max-age=600; SameSite=Lax`;
      }
      window.location.href = data.url;
    }
  };

  return (
    <div className="min-h-screen flex bg-surface relative overflow-hidden">
      {/* Left Panel — Branding */}
      <div className={`hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 ${
        role === "counsellor"
          ? "bg-gradient-to-br from-secondary via-secondary-container to-primary"
          : "bg-gradient-to-br from-primary via-primary-container to-secondary"
      }`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 max-w-md text-center">
          <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-white/20">
            <span className="material-symbols-outlined icon-fill text-white text-[40px]">
              {role === "counsellor" ? "medical_information" : "psychiatry"}
            </span>
          </div>
          <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-6">
            {role === "counsellor" ? "Counsellor Portal" : "Student Portal"}
          </p>
          <h1 className="text-4xl font-black text-white mb-4 leading-tight">
            {role === "counsellor" ? "Support students, save lives." : "Your mind matters."}
          </h1>
          <p className="text-white/80 text-lg leading-relaxed mb-8">
            {role === "counsellor"
              ? "Access your dashboard to monitor student wellbeing, review screenings, and provide timely interventions."
              : "AI-powered mental health support designed for university students. Safe, confidential, and always available."}
          </p>

          <div className="space-y-4 text-left">
            {role === "counsellor" ? (
              <>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                  <span className="material-symbols-outlined text-secondary-container text-[22px]">monitoring</span>
                  <span className="text-white/90 text-sm">Real-time student risk analytics</span>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                  <span className="material-symbols-outlined text-secondary-container text-[22px]">forum</span>
                  <span className="text-white/90 text-sm">Secure messaging with students</span>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                  <span className="material-symbols-outlined text-secondary-container text-[22px]">assignment</span>
                  <span className="text-white/90 text-sm">PHQ-9 results and referral management</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                  <span className="material-symbols-outlined text-secondary-container text-[22px]">psychology</span>
                  <span className="text-white/90 text-sm">PHQ-9 screening with NLP analysis</span>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                  <span className="material-symbols-outlined text-secondary-container text-[22px]">mood</span>
                  <span className="text-white/90 text-sm">Daily mood tracking and insights</span>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                  <span className="material-symbols-outlined text-secondary-container text-[22px]">shield</span>
                  <span className="text-white/90 text-sm">End-to-end encrypted and private</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
        <div className="fixed inset-0 pointer-events-none overflow-hidden lg:hidden">
          <div className="bg-blob-1" />
          <div className="bg-blob-2" />
        </div>

        <div className="relative z-10 w-full max-w-sm">
          {/* Mobile logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined icon-fill text-on-primary text-[22px]">psychiatry</span>
              </div>
              <span className="font-black text-2xl text-primary">MindCare AI</span>
            </Link>
            <p className="text-on-surface-variant text-xs font-medium uppercase tracking-wider mt-2">
              {role === "counsellor" ? "Counsellor Portal" : "Student Portal"}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-7 shadow-lg shadow-primary/5">
            <h1 className="text-lg font-bold text-on-surface mb-1">Sign In</h1>
            <p className="text-xs text-on-surface-variant mb-6">
              {role === "counsellor" ? "Access your counsellor dashboard" : "Access your wellness dashboard"}
            </p>

            {/* OAuth */}
            <button
              onClick={() => handleOAuth("google")}
              disabled={oauthLoading !== null}
              className="w-full flex items-center justify-center gap-3 py-3 border border-outline-variant/60 rounded-2xl text-sm font-medium text-on-surface hover:bg-surface-container-low hover:border-outline transition-all disabled:opacity-50 shadow-sm"
            >
              {oauthLoading === "google" ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {oauthLoading === "google" ? "Connecting..." : "Continue with Google"}
            </button>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-outline-variant/50" />
              <span className="text-xs text-on-surface-variant/70 font-medium">or</span>
              <div className="flex-1 h-px bg-outline-variant/50" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wide">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.ac.ug"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                    Password
                  </label>
                  <button type="button" onClick={() => { setResetMode(true); handleResetPassword(); }} className="text-xs text-primary font-medium hover:underline">
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                    className="w-full pl-10 pr-10 py-3 bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {resetSent && (
                <div className="flex items-start gap-2 p-3 bg-secondary-container text-on-secondary-container text-sm rounded-xl animate-fade-in">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">check_circle</span>
                  <span>Password reset email sent. Check your inbox.</span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 bg-error-container/80 text-on-error-container text-sm rounded-xl animate-fade-in">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-on-primary font-semibold rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[20px]">login</span>
                )}
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-on-surface-variant mt-6">
            Don&apos;t have an account?{" "}
            <Link href={`/auth/sign-up${role === "counsellor" ? "?role=counsellor" : ""}`} className="text-primary font-semibold hover:underline">
              Create one
            </Link>
          </p>

          <div className="text-center mt-3">
            <Link
              href={`/auth/sign-in${role === "counsellor" ? "" : "?role=counsellor"}`}
              className="text-xs text-on-surface-variant/70 hover:text-primary transition-colors"
            >
              {role === "counsellor" ? "← Switch to Student Portal" : "Are you a counsellor? →"}
            </Link>
          </div>

          <p className="text-center text-xs text-on-surface-variant/50 mt-4">
            Protected by encryption · HIPAA-aligned
          </p>
        </div>
      </div>
    </div>
  );
}
