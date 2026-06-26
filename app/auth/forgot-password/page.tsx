"use client";

import { useState } from "react";
import Link from "next/link";
import { insforge } from "@/lib/insforge";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "code" | "reset" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const { error: err } = await insforge.auth.sendResetPasswordEmail({ email });
    if (err) { setError(err.message); setLoading(false); return; }
    setStep("code");
    setLoading(false);
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const { data, error: err } = await insforge.auth.exchangeResetPasswordToken({ email, code });
    if (err || !data) { setError(err?.message || "Invalid code."); setLoading(false); return; }
    setResetToken(data.token);
    setStep("reset");
    setLoading(false);
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    const { error: err } = await insforge.auth.resetPassword({ newPassword, otp: resetToken });
    if (err) { setError(err.message); setLoading(false); return; }
    setStep("done");
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black text-primary">MindCare AI</Link>
          <p className="text-on-surface-variant mt-2 text-sm">
            {step === "email" && "Reset your password"}
            {step === "code" && "Enter verification code"}
            {step === "reset" && "Create new password"}
            {step === "done" && "Password reset!"}
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-sm">
          {step === "email" && (
            <form onSubmit={handleSendEmail} className="space-y-5">
              <p className="text-sm text-on-surface-variant">Enter your email address and we'll send you a 6-digit reset code.</p>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              {error && <p className="text-sm text-error bg-error-container px-3 py-2 rounded-lg">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-primary text-on-primary font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
                {loading ? "Sending…" : "Send Reset Code"}
              </button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <p className="text-sm text-on-surface-variant">Enter the 6-digit code sent to <strong>{email}</strong>.</p>
              <input type="text" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value)}
                placeholder="000000"
                className="w-full text-center text-2xl font-bold tracking-[0.5em] bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary" />
              {error && <p className="text-sm text-error bg-error-container px-3 py-2 rounded-lg">{error}</p>}
              <button type="submit" disabled={loading || code.length < 6}
                className="w-full bg-primary text-on-primary font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
                {loading ? "Verifying…" : "Verify Code"}
              </button>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleReset} className="space-y-5">
              <p className="text-sm text-on-surface-variant">Enter your new password.</p>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">New Password</label>
                <input type="password" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              {error && <p className="text-sm text-error bg-error-container px-3 py-2 rounded-lg">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-primary text-on-primary font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
                {loading ? "Resetting…" : "Reset Password"}
              </button>
            </form>
          )}

          {step === "done" && (
            <div className="text-center space-y-4">
              <span className="material-symbols-outlined icon-fill text-secondary text-[60px] block">check_circle</span>
              <h3 className="text-lg font-bold text-on-surface">Password Reset Successfully</h3>
              <p className="text-sm text-on-surface-variant">You can now sign in with your new password.</p>
              <Link href="/auth/sign-in"
                className="block w-full bg-primary text-on-primary font-semibold py-3 rounded-xl hover:opacity-90 text-center">
                Sign In
              </Link>
            </div>
          )}

          {step !== "done" && (
            <p className="mt-5 text-center text-sm text-on-surface-variant">
              <Link href="/auth/sign-in" className="text-primary font-semibold hover:underline">← Back to Sign In</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
