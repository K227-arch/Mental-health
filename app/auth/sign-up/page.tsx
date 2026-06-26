"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { insforge } from "@/lib/insforge";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    faculty: "",
    year: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifyStep, setVerifyStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "Sign up failed.");
      setLoading(false);
      return;
    }

    if (json.requireEmailVerification) {
      setVerifyStep(true);
    } else {
      router.push(form.role === "counsellor" ? "/counsellor" : "/dashboard");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setOtpLoading(true);
    setOtpError("");

    const { data, error: err } = await insforge.auth.verifyEmail({
      email: form.email,
      otp,
    });

    if (err || !data) {
      setOtpError(err?.message || "Invalid code. Try again.");
      setOtpLoading(false);
      return;
    }

    router.push(form.role === "counsellor" ? "/counsellor" : "/dashboard");
    router.refresh();
  }

  if (verifyStep) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="text-3xl font-black text-primary">
              MindCare AI
            </Link>
            <p className="text-on-surface-variant mt-2 text-sm">
              Verify your email
            </p>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5 p-4 bg-primary-container/30 rounded-xl">
              <span className="material-symbols-outlined text-primary">mail</span>
              <p className="text-sm text-on-surface">
                We sent a 6-digit code to{" "}
                <strong className="text-primary">{form.email}</strong>
              </p>
            </div>
            <form onSubmit={handleVerify} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full text-center text-3xl font-black tracking-[0.6em] bg-surface-container-low border border-outline-variant rounded-xl px-4 py-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {otpError && (
                <p className="text-sm text-error bg-error-container px-3 py-2 rounded-lg">
                  {otpError}
                </p>
              )}
              <button
                type="submit"
                disabled={otpLoading || otp.length < 6}
                className="w-full bg-primary text-on-primary font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {otpLoading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
                    Verifying…
                  </>
                ) : (
                  "Verify Email"
                )}
              </button>
              <button
                type="button"
                onClick={() =>
                  insforge.auth.resendVerificationEmail({ email: form.email })
                }
                className="w-full text-sm text-on-surface-variant hover:text-primary transition-colors py-2"
              >
                Didn&apos;t get the code? Resend
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black text-primary">
            MindCare AI
          </Link>
          <p className="text-on-surface-variant mt-2 text-sm">
            Create your account
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-sm">
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Role toggle */}
            <div className="flex bg-surface-container rounded-xl p-1 gap-1">
              {["student", "counsellor"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set("role", r)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-colors ${
                    form.role === r
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {r === "student" ? "🎓 Student" : "👩‍⚕️ Counsellor"}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@university.edu"
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {form.role === "student" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">
                    Faculty
                  </label>
                  <input
                    type="text"
                    value={form.faculty}
                    onChange={(e) => set("faculty", e.target.value)}
                    placeholder="Engineering"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">
                    Year
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={form.year}
                    onChange={(e) => set("year", e.target.value)}
                    placeholder="2"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-error-container text-on-error-container text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-on-surface-variant">
            Already have an account?{" "}
            <Link
              href="/auth/sign-in"
              className="text-primary font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/crisis"
            className="text-error text-sm font-medium flex items-center justify-center gap-1 hover:underline"
          >
            <span className="material-symbols-outlined text-[16px]">emergency</span>
            Need immediate help?
          </Link>
        </div>
      </div>
    </div>
  );
}
