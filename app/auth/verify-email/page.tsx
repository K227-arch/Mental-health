"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student");
  const [signUpData, setSignUpData] = useState<any>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    const roleParam = params.get("role");
    if (emailParam) setEmail(emailParam);
    if (roleParam) setRole(roleParam);

    // Retrieve sign-up data from sessionStorage
    const stored = sessionStorage.getItem("pendingSignUp");
    if (stored) {
      setSignUpData(JSON.parse(stored));
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newCode = [...code];
      digits.forEach((d, i) => {
        if (index + i < 6) newCode[index + i] = d;
      });
      setCode(newCode);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const otp = code.join("");
    if (otp.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid verification code. Please try again.");
        setLoading(false);
        return;
      }

      // The verify route sets the httpOnly cookie server-side. Also set the
      // non-httpOnly fallback so /api/auth/me can decode the JWT client-side.
      if (data.accessToken) {
        document.cookie = `insforge_access_token=${data.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      }

      // Create profile if we have pending sign-up data
      if (signUpData && data.userId) {
        const profileRes = await fetch("/api/auth/sign-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: data.userId,
            ...signUpData,
          }),
        }).catch(() => null);

        // Suspended accounts cannot re-register.
        if (profileRes && profileRes.status === 403) {
          const body = await profileRes.json().catch(() => ({}));
          document.cookie = "insforge_access_token=; path=/; max-age=0";
          await fetch("/api/auth/sign-out", { method: "POST" }).catch(() => {});
          sessionStorage.removeItem("pendingSignUp");
          setError(body.error || "This account has been suspended and cannot be re-registered.");
          setLoading(false);
          return;
        }
        sessionStorage.removeItem("pendingSignUp");
      }

      // Redirect to appropriate dashboard
      const redirectTarget = role === "counsellor" ? "/counsellor" : "/dashboard";
      router.push(redirectTarget);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResendSuccess(false);
    setError(null);

    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to resend code.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-6 py-12 relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="bg-blob-1" />
        <div className="bg-blob-2" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo + Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <img src="/logo.jpeg" alt="Selfcare Hub" className="w-14 h-14 object-contain rounded-xl mx-auto mb-3" />
          </Link>
          <h2 className="font-black text-xl text-primary">Selfcare Hub</h2>
        </div>

        {/* Verification Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-7 shadow-lg shadow-primary/5">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-[28px]">mark_email_read</span>
            </div>
            <h1 className="text-lg font-bold text-on-surface mb-1">Verify your email</h1>
            <p className="text-sm text-on-surface-variant">
              We sent a 6-digit code to
            </p>
            {email && (
              <p className="text-sm font-semibold text-on-surface mt-1">{email}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* OTP Input */}
            <div className="flex justify-center gap-2.5">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-11 h-13 text-center text-lg font-bold bg-surface-container-low border border-outline-variant/60 text-on-surface rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>

            {resendSuccess && (
              <div className="flex items-center gap-2 p-3 bg-secondary-container text-on-secondary-container text-sm rounded-xl animate-fade-in">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>New code sent. Check your inbox.</span>
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
              disabled={loading || code.join("").length !== 6}
              className="w-full py-3 bg-primary text-on-primary font-semibold rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">verified</span>
              )}
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-xs text-on-surface-variant mb-2">Didn't receive the code?</p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-primary font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? "Sending..." : "Resend Code"}
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-on-surface-variant mt-6">
          Wrong email?{" "}
          <a href={`/auth/sign-up${role === "counsellor" ? "?role=counsellor" : ""}`} className="text-primary font-semibold hover:underline">
            Go back
          </a>
        </p>
      </div>
    </div>
  );
}
