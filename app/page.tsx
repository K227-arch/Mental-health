"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Footer from "./components/Footer";
import LanguageSwitcher from "./components/LanguageSwitcher";
import LandingChatbot from "./components/LandingChatbot";
import { useTranslation } from "./lib/i18n";

const MindScene = dynamic(() => import("./components/MindScene"), { ssr: false });

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: "easeOut" as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const features = [
  {
    icon: "psychology",
    title: "AI Wellness Screening",
    description:
      "Clinically validated assessments enhanced with NLP sentiment analysis for deeper insights.",
    href: "/auth/sign-in",
    color: "bg-primary-container text-on-primary-container",
  },
  {
    icon: "monitoring",
    title: "Intelligent Mood Tracking",
    description:
      "Longitudinal mood analytics that detect patterns, identify triggers, and inform proactive interventions.",
    href: "/auth/sign-in",
    color: "bg-secondary-container text-on-secondary-container",
  },
  {
    icon: "shield",
    title: "Private & Encrypted",
    description:
      "End-to-end encryption with zero-knowledge architecture. Your data stays yours — always.",
    href: "/auth/sign-in",
    color: "bg-surface-container-high text-on-surface",
  },
  {
    icon: "emergency",
    title: "24/7 Crisis Support",
    description:
      "Immediate access to grounding exercises, breathing tools, and direct crisis hotline connections.",
    href: "/auth/sign-in",
    color: "bg-error-container text-on-error-container",
  },
  {
    icon: "forum",
    title: "Secure Counsellor Access",
    description:
      "Encrypted messaging with professional counsellors. Seamless escalation when you need human support.",
    href: "/auth/sign-in",
    color: "bg-primary-container text-on-primary-container",
  },
  {
    icon: "self_improvement",
    title: "Wellness Resources",
    description:
      "CBT-based exercises, mindfulness sessions, hope gallery, and evidence-based resilience tools.",
    href: "/auth/sign-in",
    color: "bg-secondary-container text-on-secondary-container",
  },
];

const stats = [
  { value: "5,000+", label: "Active Students" },
  { value: "24/7", label: "Always Available" },
  { value: "92%", label: "Report Improvement" },
  { value: "4", label: "Languages Supported" },
];

const steps = [
  {
    number: "01",
    title: "Check In",
    description: "Complete a conversational screening. Our NLP model analyzes your responses beyond just the score.",
    icon: "psychology",
  },
  {
    number: "02",
    title: "Get Insights",
    description: "Receive AI-powered analysis of your mental state with mood trends, risk indicators, and personalized recommendations.",
    icon: "insights",
  },
  {
    number: "03",
    title: "Take Action",
    description: "Access wellness resources, connect with a counsellor, or use crisis support tools — the right help at the right time.",
    icon: "rocket_launch",
  },
];

export default function LandingPage() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-surface overflow-x-hidden relative">
      {/* 3D Bubbles Background — covers entire page */}
      <div className="fixed inset-0 opacity-55 pointer-events-none z-0">
        <MindScene />
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 md:px-16 h-16 bg-surface/85 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm"
      >
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.jpeg" alt="Selfcare Hub" className="w-14 h-14 object-contain rounded-xl shadow-sm" />
          <span className="hidden sm:block font-black text-2xl text-primary tracking-tight" style={{ fontFamily: "inherit" }}>Selfcare Hub</span>
        </Link>
        <div className="hidden md:flex items-center gap-2">
          <a href="#" className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors px-2">Home</a>
          <a href="#features" className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors px-2">{t("nav.features")}</a>
          <a href="#how-it-works" className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors px-2">{t("howItWorks.label")}</a>
          <a href="#counsellors" className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors px-2">{t("nav.counsellors")}</a>
          <LanguageSwitcher variant="light" />
          <Link href="/auth/sign-in" className="px-2 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">
            {t("nav.signin")}
          </Link>
          <Link href="/auth/sign-up" className="px-3 py-2 bg-primary text-on-primary text-sm font-semibold rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            {t("nav.signup")}
          </Link>
        </div>
        <div className="flex md:hidden items-center gap-2">
          <LanguageSwitcher variant="light" />
          {/* Hamburger — mobile only */}
          <button
            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-surface-container-lowest border-l border-outline-variant shadow-xl md:hidden flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 h-16 border-b border-outline-variant">
                <div className="flex items-center gap-2">
                  <img src="/logo.jpeg" alt="" className="w-8 h-8 object-contain rounded-lg" />
                  <span className="font-black text-lg text-primary">Selfcare Hub</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {[
                  { href: "#features", label: t("nav.features"), icon: "star" },
                  { href: "#how-it-works", label: t("howItWorks.label"), icon: "help_outline" },
                  { href: "#counsellors", label: t("nav.counsellors"), icon: "person" },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant">{item.icon}</span>
                    {item.label}
                  </a>
                ))}

                <div className="my-3 border-t border-outline-variant" />

                <Link href="/auth/sign-in" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant">login</span>
                  {t("nav.signin")}
                </Link>
              </nav>

              {/* CTA at bottom */}
              <div className="px-4 py-5 border-t border-outline-variant">
                <Link
                  href="/auth/sign-up"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-on-primary font-semibold rounded-xl shadow-md text-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                  {t("nav.signup")}
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hero with 3D Background */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-16 text-center overflow-hidden">
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface/40 via-surface/20 to-surface/40 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,var(--color-surface)_80%)] pointer-events-none" />

        {/* Content */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 max-w-4xl mx-auto"
        >
          {/* Big Logo */}
          <motion.div variants={fadeUp} custom={0} className="mb-8 flex justify-center">
            <img src="/logo.jpeg" alt="Selfcare Hub" className="w-36 h-36 md:w-44 md:h-44 object-contain rounded-3xl shadow-lg" />
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-3xl sm:text-4xl md:text-6xl font-black text-on-surface leading-[1.1] mb-6 tracking-tight"
          >
            {t("landing.title").split("going through matters.")[0]}
            <br className="hidden md:block" />
            <span className="text-primary">{t("landing.title").includes("going through") ? "going through matters." : t("landing.title").split(".").pop()}</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-on-surface-variant text-sm sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light"
          >
            {t("landing.subtitle")}
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/sign-up"
              className="group px-8 py-4 bg-primary text-on-primary font-semibold rounded-2xl shadow-lg shadow-primary/15 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all flex items-center gap-2 justify-center"
            >
              <span className="material-symbols-outlined text-[20px]">favorite</span>
              {t("landing.cta")}
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
            </Link>
            <Link
              href="/crisis"
              className="px-8 py-4 bg-error text-on-error font-semibold rounded-2xl hover:opacity-90 transition-all flex items-center gap-2 justify-center shadow-lg"
            >
              <span className="material-symbols-outlined icon-fill text-[20px]">phone_in_talk</span>
              {t("landing.crisis.btn")}
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div variants={fadeUp} custom={4} className="mt-12 flex flex-wrap items-center justify-center gap-6 text-on-surface-variant/60">
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              {t("landing.trust.confidential")}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              {t("landing.trust.ai")}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <span className="material-symbols-outlined text-[14px]">language</span>
              {t("landing.trust.languages")}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              {t("landing.trust.available")}
            </span>
          </motion.div>
        </motion.div>

        {/* Scroll */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        >
          <span className="text-xs font-medium text-on-surface-variant/50 uppercase tracking-wider">Explore</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-5 h-8 border-2 border-outline-variant/30 rounded-full flex items-start justify-center p-1"
          >
            <div className="w-1 h-2 bg-primary/50 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="px-6 md:px-16 py-16 bg-surface-container-lowest/70 backdrop-blur-sm border-y border-outline-variant/20"
      >
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-4xl font-black text-primary mb-1">{s.value}</div>
              <div className="text-sm text-on-surface-variant font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Features */}
      <section id="features" className="px-6 md:px-16 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-secondary mb-3 block">{t("nav.features")}</span>
            <h2 className="text-3xl md:text-5xl font-bold text-on-surface mb-4 tracking-tight">
              {t("landing.features.title")}
            </h2>
            <p className="text-on-surface-variant text-lg max-w-xl mx-auto font-light">
              {t("landing.features.subtitle")}
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} custom={i}>
                <Link
                  href={f.href}
                  className="group bg-surface-container-lowest/80 backdrop-blur-sm border border-outline-variant/40 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4 h-full"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${f.color}`}>
                    <span className="material-symbols-outlined icon-fill text-[22px]">{f.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-on-surface mb-2 group-hover:text-primary transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed">{f.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-primary text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Learn more</span>
                    <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-6 md:px-16 py-24 bg-surface-container-lowest/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-secondary mb-3 block">How It Works</span>
            <h2 className="text-3xl md:text-5xl font-bold text-on-surface mb-4 tracking-tight">
              {t("landing.howit.title")}
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8"
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                variants={fadeUp}
                custom={i}
                className="relative text-center md:text-left"
              >
                <div className="flex flex-col items-center md:items-start gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-black text-primary/15">{step.number}</span>
                    <div className="w-11 h-11 bg-primary-container rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-primary-container text-[22px]">{step.icon}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-on-surface">{step.title}</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed font-light">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonial */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8 }}
        className="px-6 md:px-16 py-20"
      >
        <div className="max-w-3xl mx-auto text-center">
          <span className="material-symbols-outlined text-primary/20 text-[48px] mb-4">format_quote</span>
          <blockquote className="text-xl md:text-2xl font-medium text-on-surface leading-relaxed mb-6 italic">&quot;Selfcare Hub helped me realize I wasn&apos;t alone. The daily check-ins became my anchor during exam season. I finally had the courage to talk to a counsellor.&quot;</blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-on-primary-container">SK</span>
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-on-surface">Sarah K.</div>
              <div className="text-xs text-on-surface-variant">3rd Year Student, MUBS</div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Counsellor CTA */}
      <section id="counsellors" className="px-6 md:px-16 py-20 bg-primary-container/10 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-surface-container-lowest/80 backdrop-blur-sm border border-outline-variant/40 rounded-3xl p-8 md:p-14 shadow-sm flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary-container text-on-secondary-container text-xs font-semibold rounded-full mb-5">
                <span className="material-symbols-outlined text-[14px]">medical_information</span>
                For Professionals
              </div>
              <h3 className="text-2xl md:text-4xl font-bold text-on-surface mb-3 tracking-tight">
                Are you a mental health professional?
              </h3>
              <p className="text-on-surface-variant leading-relaxed mb-8 font-light">
                Access AI-powered risk analytics, caseload monitoring, real-time alerts, and secure student 
                communication. Deliver proactive, data-informed care at scale.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/auth/sign-in?role=counsellor"
                  className="px-6 py-3 bg-primary text-on-primary font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 justify-center"
                >
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Counsellor Sign In
                </Link>
                <Link
                  href="/auth/sign-up?role=counsellor"
                  className="px-6 py-3 border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-container transition-all flex items-center gap-2 justify-center"
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  Register
                </Link>
              </div>
            </div>
            <div className="hidden md:flex shrink-0">
              <div className="w-44 h-44 bg-gradient-to-br from-primary-container to-secondary-container rounded-3xl flex items-center justify-center border border-outline-variant/20">
                <span className="material-symbols-outlined icon-fill text-primary text-[72px]">monitoring</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Languages */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="px-6 md:px-16 py-14 text-center"
      >
        <h3 className="text-on-surface-variant text-xs font-semibold mb-5 uppercase tracking-widest">
          Multilingual Support
        </h3>
        <div className="flex flex-wrap justify-center gap-3">
          {["English", "Runyankore", "Luganda", "Swahili"].map((lang) => (
            <span
              key={lang}
              className="px-5 py-2.5 bg-surface-container-low rounded-full text-sm font-medium text-on-surface border border-outline-variant/40"
            >
              {lang}
            </span>
          ))}
        </div>
      </motion.section>

      {/* Final CTA */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="px-6 md:px-16 py-24 text-center relative z-20"
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-on-surface mb-4 tracking-tight">
            {t("landing.ready")}
          </h2>
          <p className="text-on-surface-variant text-lg mb-8 font-light">
            {t("landing.ready.sub")}
          </p>
          <Link
            href="/auth/sign-up"
            className="relative z-30 inline-flex items-center gap-2 px-8 py-4 bg-primary text-on-primary font-semibold rounded-2xl shadow-lg shadow-primary/15 hover:shadow-xl hover:-translate-y-1 transition-all text-lg"
          >
            <span className="material-symbols-outlined text-[22px]">rocket_launch</span>
            {t("landing.getstarted")}
          </Link>
        </div>
      </motion.section>

      <Footer />
      <LandingChatbot />
    </div>
  );
}
