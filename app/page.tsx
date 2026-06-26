"use client";

import Link from "next/link";
import Footer from "./components/Footer";
import { useEffect, useState } from "react";
import { insforge } from "@/lib/insforge";

const FEATURES = [
  {
    icon: "psychology",
    title: "AI Wellness Screening",
    description: "Conversational PHQ-9 screening with NLP analysis. Get accurate mental health assessments in a supportive, non-clinical way.",
    href: "/screening",
    color: "bg-primary-container text-on-primary-container",
  },
  {
    icon: "dashboard",
    title: "Student Dashboard",
    description: "Track your mood journey, view wellness milestones, and monitor your progress with a personalized digital twin visualization.",
    href: "/dashboard",
    color: "bg-secondary-container text-on-secondary-container",
  },
  {
    icon: "emergency",
    title: "Crisis Support",
    description: "Immediate crisis resources, grounding exercises, and 24/7 access to emergency help. You are never alone.",
    href: "/crisis",
    color: "bg-error-container text-on-error-container",
  },
  {
    icon: "favorite",
    title: "Wellness Hub",
    description: "Breathing exercises, hope gallery, CBT tools, and personalized resources for mental resilience.",
    href: "/wellness",
    color: "bg-tertiary-fixed text-on-tertiary-fixed",
  },
  {
    icon: "chat",
    title: "Secure Messaging",
    description: "Real-time encrypted chat between students and counsellors. Messages are monitored for crisis keywords.",
    href: "/messages",
    color: "bg-primary-container text-on-primary-container",
  },
  {
    icon: "monitoring",
    title: "Counsellor Analytics",
    description: "AI-powered decision support, case risk stratification, and longitudinal population wellness analytics.",
    href: "/counsellor",
    color: "bg-surface-container-high text-on-surface",
  },
];

const LANGUAGES = ["English", "Runyankore", "Luganda", "Swahili"];

interface LiveStats {
  sessions: number;
  screenings: number;
  activities: number;
  loaded: boolean;
}

export default function LandingPage() {
  const [stats, setStats] = useState<LiveStats>({ sessions: 0, screenings: 0, activities: 0, loaded: false });
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    // Check auth silently — redirect signed-in users
    insforge.auth.getCurrentUser().then(({ data }) => {
      if (data?.user) setAuthed(true);
    });

    // Load live platform stats
    Promise.all([
      insforge.database.from("counsellor_sessions").select("id", { count: "exact", head: true }),
      insforge.database.from("screening_results").select("id", { count: "exact", head: true }),
      insforge.database.from("wellness_activities").select("id", { count: "exact", head: true }),
    ]).then(([sess, screen, act]) => {
      setStats({
        sessions: sess.count ?? 0,
        screenings: screen.count ?? 0,
        activities: act.count ?? 0,
        loaded: true,
      });
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="bg-blob-1" />
        <div className="bg-blob-2" />
      </div>

      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 md:px-20 h-16 bg-surface/95 backdrop-blur-sm border-b border-outline-variant/30 shadow-sm">
        <span className="font-black text-2xl text-primary">MindCare AI</span>
        <div className="flex items-center gap-2">
          <Link href="/counsellor" className="hidden md:flex items-center gap-1 px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[18px]">person</span>
            Counsellor Portal
          </Link>
          <Link href="/crisis" className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-error hover:bg-error-container/50 rounded-lg transition-colors">
            <span className="material-symbols-outlined icon-fill text-[18px]">medical_services</span>
            Emergency
          </Link>
          {authed ? (
            <Link href="/dashboard" className="px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded-lg shadow-sm hover:opacity-90 transition-opacity">
              Go to Dashboard
            </Link>
          ) : (
            <Link href="/auth/sign-in" className="px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded-lg shadow-sm hover:opacity-90 transition-opacity">
              Get Started
            </Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-16 text-center z-10">
        <div className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-container text-sm font-semibold rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            AI-Powered Student Wellness Platform
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-on-surface leading-tight mb-6 tracking-tight">
            Your mental health{" "}
            <span className="text-primary">matters</span>.{" "}
            <br className="hidden md:block" />
            We&apos;re here to help.
          </h1>
          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-8 leading-relaxed">
            MindCare AI provides confidential, AI-powered mental health support for university students. From daily check-ins to crisis intervention — we&apos;ve got you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={authed ? "/screening" : "/auth/sign-up"} className="px-8 py-4 bg-primary text-on-primary font-semibold rounded-xl shadow-md hover:opacity-90 transition-all hover:-translate-y-0.5 flex items-center gap-2 justify-center">
              <span className="material-symbols-outlined text-[20px]">psychology</span>
              {authed ? "Start Check-In" : "Create Account"}
            </Link>
            <Link href="/crisis" className="px-8 py-4 bg-error text-on-error font-semibold rounded-xl shadow-md hover:opacity-90 transition-all hover:-translate-y-0.5 flex items-center gap-2 justify-center">
              <span className="material-symbols-outlined icon-fill text-[20px]">emergency</span>
              Crisis Support
            </Link>
          </div>
          {!authed && (
            <p className="mt-4 text-sm text-on-surface-variant">
              Already have an account?{" "}
              <Link href="/auth/sign-in" className="text-primary font-semibold hover:underline">Sign in</Link>
            </p>
          )}
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-on-surface-variant opacity-60 animate-bounce">
          <span className="text-xs font-medium">Scroll to explore</span>
          <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
        </div>
      </section>

      {/* Live Stats */}
      <section className="px-6 md:px-20 py-14 bg-surface-container-lowest z-10 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Live Platform Data</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Active Sessions", value: stats.loaded ? stats.sessions.toString() : "—", sublabel: "Counsellor sessions" },
              { label: "Screenings Done", value: stats.loaded ? stats.screenings.toString() : "—", sublabel: "PHQ-9 assessments" },
              { label: "Wellness Activities", value: stats.loaded ? stats.activities.toString() : "—", sublabel: "Exercises completed" },
              { label: "Languages", value: "4", sublabel: "Supported languages" },
            ].map(s => (
              <div key={s.label} className="text-center bg-surface border border-outline-variant rounded-2xl p-5 shadow-sm">
                <div className={`text-3xl md:text-4xl font-black text-primary mb-1 ${!stats.loaded && s.label !== "Languages" ? "animate-pulse" : ""}`}>
                  {s.value}
                </div>
                <div className="text-sm font-semibold text-on-surface">{s.label}</div>
                <div className="text-xs text-on-surface-variant mt-0.5">{s.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 md:px-20 py-20 z-10 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-3">Everything you need to thrive</h2>
            <p className="text-on-surface-variant text-lg max-w-xl mx-auto">Comprehensive tools designed for students and counsellors, built with care.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <Link key={f.title} href={f.href}
                className="group bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${f.color}`}>
                  <span className="material-symbols-outlined icon-fill text-[26px]">{f.icon}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-on-surface mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{f.description}</p>
                </div>
                <div className="mt-auto flex items-center gap-1 text-primary text-sm font-semibold">
                  <span>Explore</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 md:px-20 py-20 bg-gradient-to-br from-primary-container/20 to-secondary-container/10 z-10 relative">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-3">How MindCare AI works</h2>
          <p className="text-on-surface-variant text-lg">Simple, secure, and always available.</p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "01", icon: "person_add", title: "Create your account", desc: "Sign up with your university email. All data is encrypted and confidential." },
            { step: "02", icon: "psychology", title: "Complete your check-in", desc: "Our AI guides you through a PHQ-9 screening and logs your mood in real time." },
            { step: "03", icon: "support_agent", title: "Get connected to care", desc: "High-risk cases are automatically flagged and routed to a counsellor for follow-up." },
          ].map(step => (
            <div key={step.step} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm text-center flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-container text-primary flex items-center justify-center">
                <span className="material-symbols-outlined icon-fill text-[28px]">{step.icon}</span>
              </div>
              <span className="text-xs font-black text-primary/40 uppercase tracking-widest">{step.step}</span>
              <h3 className="text-base font-bold text-on-surface">{step.title}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Counsellor CTA */}
      <section className="px-6 md:px-20 py-16 z-10 relative">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 md:p-12 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-container text-on-primary-container text-xs font-semibold rounded-full mb-4">
              <span className="material-symbols-outlined text-[14px]">support_agent</span>
              Counsellor Portal
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-on-surface mb-2">Are you a mental health professional?</h3>
            <p className="text-on-surface-variant max-w-lg">
              Access AI-powered decision support, case management tools, real-time chat, and longitudinal analytics to deliver better care.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <Link href="/counsellor" className="px-6 py-3 bg-primary text-on-primary font-semibold rounded-xl shadow-md hover:opacity-90 transition-opacity flex items-center gap-2 justify-center">
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              Counsellor Dashboard
            </Link>
            <Link href="/auth/sign-up" className="px-6 py-3 border border-primary text-primary font-semibold rounded-xl hover:bg-primary-container/30 transition-colors flex items-center gap-2 justify-center">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              Register as Counsellor
            </Link>
          </div>
        </div>
      </section>

      {/* Privacy Promise */}
      <section className="px-6 md:px-20 py-14 z-10 relative">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-on-surface mb-4">Your privacy is our priority</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
            {[
              { icon: "lock", title: "End-to-end Encryption", desc: "All messages and health data are encrypted at rest and in transit." },
              { icon: "visibility_off", title: "Anonymous Mode", desc: "Students can opt-in to anonymise their identity in all reports and analytics." },
              { icon: "verified_user", title: "HIPAA-aligned", desc: "Data handling follows healthcare privacy standards to protect your information." },
            ].map(p => (
              <div key={p.title} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 text-center shadow-sm">
                <span className="material-symbols-outlined icon-fill text-primary text-[32px] block mb-3">{p.icon}</span>
                <h3 className="text-sm font-bold text-on-surface mb-1">{p.title}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Languages */}
      <section className="px-6 md:px-20 py-12 text-center z-10 relative bg-surface-container-lowest">
        <h3 className="text-on-surface-variant text-sm font-semibold mb-4 uppercase tracking-wider">Multilingual Support</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {LANGUAGES.map(lang => (
            <span key={lang} className="px-4 py-2 bg-surface rounded-full text-sm font-medium text-on-surface border border-outline-variant">
              {lang}
            </span>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
