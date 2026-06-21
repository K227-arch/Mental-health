"use client";

import Link from "next/link";
import Footer from "./components/Footer";

const features = [
  {
    icon: "psychology",
    title: "AI Wellness Screening",
    description:
      "Conversational PHQ-9 screening with multimodal NLP analysis. Get accurate mental health assessments in a supportive, non-clinical way.",
    href: "/screening",
    color: "bg-primary-container text-on-primary-container",
  },
  {
    icon: "dashboard",
    title: "Student Dashboard",
    description:
      "Track your mood journey, view wellness milestones, and monitor your progress with a personalized digital twin visualization.",
    href: "/dashboard",
    color: "bg-secondary-container text-on-secondary-container",
  },
  {
    icon: "emergency",
    title: "Crisis Support",
    description:
      "Immediate crisis resources, grounding exercises, and 24/7 access to emergency help. You are never alone.",
    href: "/crisis",
    color: "bg-error-container text-on-error-container",
  },
  {
    icon: "favorite",
    title: "Wellness Hub",
    description:
      "Breathing exercises, hope gallery, CBT tools, and personalized resources for mental resilience.",
    href: "/wellness",
    color: "bg-tertiary-fixed text-on-tertiary-fixed",
  },
];

const stats = [
  { value: "98%", label: "Student Satisfaction" },
  { value: "24/7", label: "Support Available" },
  { value: "4 Lang", label: "Multilingual Support" },
  { value: "<5min", label: "Avg Response Time" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Blob backgrounds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="bg-blob-1" />
        <div className="bg-blob-2" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 md:px-20 h-16 bg-surface/95 backdrop-blur-sm border-b border-outline-variant/30 shadow-sm">
        <span className="font-black text-2xl text-primary">MindCare AI</span>
        <div className="flex items-center gap-2">
          <Link
            href="/counsellor"
            className="hidden md:flex items-center gap-1 px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
            Counsellor Portal
          </Link>
          <Link
            href="/crisis"
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-error hover:bg-error-container/50 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined icon-fill text-[18px]">medical_services</span>
            Emergency
          </Link>
          <Link
            href="/screening"
            className="px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded-lg shadow-sm hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-16 text-center">
        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-container text-sm font-semibold rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            AI-Powered Student Wellness Platform
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-on-surface leading-tight mb-6 tracking-tight">
            Your mental health{" "}
            <span className="text-primary">matters</span>.{" "}
            <br className="hidden md:block" />
            We're here to help.
          </h1>
          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-8 leading-relaxed">
            MindCare AI provides confidential, AI-powered mental health support for university students.
            From daily check-ins to crisis intervention — we've got you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/screening"
              className="px-8 py-4 bg-primary text-on-primary font-semibold rounded-xl shadow-md hover:opacity-90 transition-all hover:-translate-y-0.5 flex items-center gap-2 justify-center"
            >
              <span className="material-symbols-outlined text-[20px]">psychology</span>
              Start Check-In
            </Link>
            <Link
              href="/crisis"
              className="px-8 py-4 bg-error text-on-error font-semibold rounded-xl shadow-md hover:opacity-90 transition-all hover:-translate-y-0.5 flex items-center gap-2 justify-center"
            >
              <span className="material-symbols-outlined icon-fill text-[20px]">emergency</span>
              Crisis Support
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-on-surface-variant opacity-60 animate-bounce">
          <span className="text-xs font-medium">Scroll to explore</span>
          <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 md:px-20 py-12 bg-surface-container-lowest">
        <div className="max-w-container-max mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-4xl font-black text-primary mb-1">{s.value}</div>
              <div className="text-sm text-on-surface-variant font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 md:px-20 py-20">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-3">
              Everything you need to thrive
            </h2>
            <p className="text-on-surface-variant text-lg max-w-xl mx-auto">
              Comprehensive tools designed for students, built with care.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className="group bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col gap-4"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${f.color}`}>
                  <span className="material-symbols-outlined icon-fill text-[26px]">{f.icon}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-on-surface mb-2 group-hover:text-primary transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{f.description}</p>
                </div>
                <div className="mt-auto flex items-center gap-1 text-primary text-sm font-semibold">
                  <span>Explore</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Counsellor CTA */}
      <section className="px-6 md:px-20 py-16 bg-primary-container/20">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row items-center justify-between gap-8 bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 md:p-12 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-container text-on-primary-container text-xs font-semibold rounded-full mb-4">
              <span className="material-symbols-outlined text-[14px]">person</span>
              Counsellor Portal
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-on-surface mb-2">
              Are you a mental health professional?
            </h3>
            <p className="text-on-surface-variant max-w-lg">
              Access AI-powered decision support, case management tools, and longitudinal analytics to deliver better care.
            </p>
          </div>
          <Link
            href="/counsellor"
            className="shrink-0 px-6 py-3 bg-primary text-on-primary font-semibold rounded-xl shadow-md hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            Go to Dashboard
          </Link>
        </div>
      </section>

      {/* Languages */}
      <section className="px-6 md:px-20 py-12 text-center">
        <h3 className="text-on-surface-variant text-sm font-semibold mb-4 uppercase tracking-wider">
          Multilingual Support
        </h3>
        <div className="flex flex-wrap justify-center gap-3">
          {["English", "Runyankore", "Luganda", "Swahili"].map((lang) => (
            <span
              key={lang}
              className="px-4 py-2 bg-surface-container rounded-full text-sm font-medium text-on-surface border border-outline-variant"
            >
              {lang}
            </span>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
