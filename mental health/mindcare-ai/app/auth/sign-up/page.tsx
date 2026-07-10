"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { insforge } from "@/lib/insforge";
import { useTranslation } from "../../lib/i18n";

export default function SignUpPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [role, setRole] = useState<"student" | "counsellor">("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("role") === "counsellor") setRole("counsellor");
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const redirectTarget = role === "counsellor" ? "/counsellor" : "/dashboard";

    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, redirect: redirectTarget }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Sign up failed");
        setLoading(false);
        return;
      }

      router.push(data.redirect || redirectTarget);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: string) => {
    setError(null);
    setOauthLoading(provider);
    const redirect = role === "counsellor" ? "/counsellor" : "/dashboard";
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

  const passwordStrength = () => {
    if (!password) return { width: "0%", color: "bg-outline-variant", label: "" };
    if (password.length < 6) return { width: "25%", color: "bg-error", label: "Weak" };
    if (password.length < 10) return { width: "60%", color: "bg-secondary", label: "Good" };
    return { width: "100%", color: "bg-primary", label: "Strong" };
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen flex bg-surface relative overflow-hidden">
      {/* Left Panel — Branding */}
      <div className={`hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 ${
        role === "counsellor"
          ? "bg-gradient-to-br from-secondary via-primary-container to-primary"
          : "bg-gradient-to-br from-secondary via-primary-container to-primary"
      }`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 max-w-md text-center">
          <img
            src="/logo.jpeg"
            alt="Selfcare Hub"
            className="w-20 h-20 object-contain rounded-2xl mx-auto mb-4 shadow-lg border border-white/20 bg-white/90"
          />
          <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-6">
            {role === "counsellor" ? t("auth.portal.counsellor") : t("auth.portal.student")}
          </p>
          <h1 className="text-4xl font-black text-white mb-4 leading-tight">
            {role === "counsellor" ? t("auth.signup.heroCounsellor") : t("auth.signup.heroStudent")}
          </h1>
          <p className="text-white/80 text-lg leading-relaxed mb-8">
            {role === "counsellor"
              ? t("auth.signup.descCounsellor")
              : t("auth.signup.descStudent")}
          </p>

          {role === "counsellor" ? (
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                <span className="material-symbols-outlined text-secondary-container text-[22px]">groups</span>
                <span className="text-white/90 text-sm">Monitor student caseload in one place</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                <span className="material-symbols-outlined text-secondary-container text-[22px]">notifications_active</span>
                <span className="text-white/90 text-sm">Instant alerts for high-risk students</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                <span className="material-symbols-outlined text-secondary-container text-[22px]">analytics</span>
                <span className="text-white/90 text-sm">AI-powered screening insights and trends</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                <div className="text-2xl font-black text-white">5K+</div>
                <div className="text-xs text-white/70 mt-1">Students</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                <div className="text-2xl font-black text-white">24/7</div>
                <div className="text-xs text-white/70 mt-1">Available</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                <div className="text-2xl font-black text-white">100%</div>
                <div className="text-xs text-white/70 mt-1">Private</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative overflow-y-auto">
        <div className="fixed inset-0 pointer-events-none overflow-hidden lg:hidden">
          <div className="bg-blob-1" />
          <div className="bg-blob-2" />
        </div>

        <div className="relative z-10 w-full max-w-sm">
          {/* Logo + Header */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-block">
              <img src="/logo.jpeg" alt="Selfcare Hub" className="w-14 h-14 object-contain rounded-xl mx-auto mb-3" />
            </Link>
            <h2 className="font-black text-xl text-primary">Selfcare Hub</h2>
            <p className="text-on-surface-variant text-xs font-medium uppercase tracking-widest mt-1.5">
              {role === "counsellor" ? t("auth.portal.counsellor") : t("auth.portal.student")}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-7 shadow-lg shadow-primary/5">
            <h1 className="text-lg font-bold text-on-surface mb-1">{t("auth.signup.title")}</h1>
            <p className="text-xs text-on-surface-variant mb-5">
              {role === "counsellor" ? t("auth.signup.counsellorSubtitle") : t("auth.signup.subtitle")}
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
              {oauthLoading === "google" ? t("auth.signin.connecting") : t("auth.signup.google")}
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-outline-variant/50" />
              <span className="text-xs text-on-surface-variant/70 font-medium">or</span>
              <div className="flex-1 h-px bg-outline-variant/50" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wide">
                  {t("auth.signup.fullName")}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
                    <span className="material-symbols-outlined text-[18px]">person</span>
                  </span>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("auth.signup.namePlaceholder")}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wide">
                  {t("auth.signin.email")}
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
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wide">
                  {t("auth.signup.password")}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
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
                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                        style={{ width: strength.width }}
                      />
                    </div>
                    <span className="text-xs text-on-surface-variant">{strength.label}</span>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wide">
                  {t("auth.signup.confirmPassword")}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                  </span>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showConfirmPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-error mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {t("auth.signup.passwordsNoMatch")}
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-error-container/80 text-on-error-container text-sm rounded-xl animate-fade-in">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-on-primary font-semibold rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                )}
                {loading ? t("auth.signup.creating") : t("auth.signup.title")}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-on-surface-variant mt-5">
            {t("auth.signup.hasAccount")}{" "}
            <a href={`/auth/sign-in${role === "counsellor" ? "?role=counsellor" : ""}`} className="text-primary font-semibold hover:underline">
              {t("auth.signup.signIn")}
            </a>
          </p>

          <div className="text-center mt-3">
            <a
              href={`/auth/sign-up${role === "counsellor" ? "" : "?role=counsellor"}`}
              className="text-xs text-on-surface-variant/70 hover:text-primary transition-colors"
            >
              {role === "counsellor" ? t("auth.signup.switchStudent") : t("auth.signup.switchCounsellor")}
            </a>
          </div>

          <p className="text-center text-xs text-on-surface-variant/50 mt-3">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-on-surface-variant">Terms</Link> and{" "}
            <Link href="/privacy" className="underline hover:text-on-surface-variant">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
