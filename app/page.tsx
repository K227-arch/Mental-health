"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Footer from "./components/Footer";

const MindScene = dynamic(() => import("./components/MindScene"), { ssr: false });

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8 } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const features = [
  {
    icon: "psychology",
    title: "AI Wellness Screening",
    description:
      "Conversational PHQ-9 screening powered by NLP. Get accurate, empathetic assessments in a supportive environment.",
    href: "/auth/sign-in",
    gradient: "from-primary/10 to-primary/5",
    iconBg: "bg-primary-container text-on-primary-container",
  },
  {
    icon: "dashboard",
    title: "Student Dashboard",
    description:
      "Track your mood journey, earn wellness milestones, and visualize your progress over time.",
    href: "/auth/sign-in",
    gradient: "from-secondary/10 to-secondary/5",
    iconBg: "bg-secondary-container text-on-secondary-container",
  },
  {
    icon: "emergency",
    title: "Crisis Support",
    description:
      "Immediate crisis resources, grounding exercises, and 24/7 access to emergency help. You are never alone.",
    href: "/auth/sign-in",
    gradient: "from-error/10 to-error/5",
    iconBg: "bg-error-container text-on-error-container",
  },
  {
    icon: "favorite",
    title: "Wellness Hub",
    description:
      "Breathing exercises, hope gallery, CBT tools, and personalized resources for mental resilience.",
    href: "/auth/sign-in",
    gradient: "from-secondary/10 to-primary/5",
    iconBg: "bg-tertiary-fixed text-on-tertiary-fixed",
  },
  {
    icon: "forum",
    title: "Secure Counsellor Chat",
    description:
      "Connect with professional counsellors through encrypted, private messaging when you need human support.",
    href: "/auth/sign-in",
    gradient: "from-primary/10 to-secondary/5",
    iconBg: "bg-primary-container text-on-primary-container",
  },
  {
    icon: "analytics",
    title: "Progress Analytics",
    description:
      "AI-generated insights on your mental health trends, sleep patterns, and intervention effectiveness.",
    href: "/auth/sign-in",
    gradient: "from-secondary/10 to-primary/5",
    iconBg: "bg-secondary-container text-on-secondary-container",
  },
];

const stats = [
  { value: "5,000+", label: "Active Students" },
  { value: "24/7", label: "Always Available" },
  { value: "4", label: "Languages" },
  { value: "92%", label: "Report Feeling Better" },
];

const testimonials = [
  {
    quote: "MindCare helped me realize I wasn't alone. The daily check-ins became my anchor during exam season.",
    name: "Sarah K.",
    role: "3rd Year, MUBS",
    avatar: "S",
  },
  {
    quote: "The PHQ-9 screening caught something I'd been ignoring for months. It connected me with a counsellor who truly helped.",
    name: "David M.",
    role: "2nd Year, Makerere",
    avatar: "D",
  },
  {
    quote: "As a counsellor, the analytics dashboard gives me insights I could never get manually. It saves lives.",
    name: "Dr. Namara R.",
    role: "University Counsellor",
    avatar: "N",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface overflow-x-hidden">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 md:px-16 h-16 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20"
      >
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined icon-fill text-on-primary text-[18px]">psychiatry</span>
          </div>
          <span className="font-black text-xl text-primary">MindCare AI</span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">Features</a>
          <a href="#testimonials" className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">Testimonials</a>
          <a href="#counsellors" className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">Counsellors</a>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/crisis"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-error text-sm font-medium hover:bg-error-container/50 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined icon-fill text-[16px]">emergency</span>
            Crisis
          </Link>
          <Link
            href="/auth/sign-in"
            className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/auth/sign-up"
            className="px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            Get Started
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section with 3D */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* 3D Background */}
        <div className="absolute inset-0 opacity-70">
          <MindScene />
        </div>

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface/60 via-surface/40 to-surface pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-center"
          >
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-container/80 backdrop-blur-sm text-on-secondary-container text-sm font-semibold rounded-full mb-6 border border-secondary/20">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                AI-Powered Student Mental Health Platform
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-5xl md:text-7xl font-black text-on-surface leading-[1.1] mb-6 tracking-tight"
            >
              Your mental health
              <br />
              <span className="bg-gradient-to-r from-primary via-primary-container to-secondary bg-clip-text text-transparent">
                deserves attention
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              MindCare AI provides confidential, AI-powered mental health support
              for university students. From daily check-ins to crisis intervention ΓÇö we&apos;ve got you.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/auth/sign-up"
                className="group px-8 py-4 bg-primary text-on-primary font-semibold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 transition-all flex items-center gap-3 justify-center"
              >
                <span className="material-symbols-outlined text-[22px]">psychology</span>
                Start Free Check-In
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
              <Link
                href="/crisis"
                className="px-8 py-4 bg-surface-container-lowest border border-outline-variant text-on-surface font-semibold rounded-2xl hover:bg-surface-container-low hover:border-outline transition-all flex items-center gap-3 justify-center shadow-sm"
              >
                <span className="material-symbols-outlined icon-fill text-error text-[22px]">emergency</span>
                Crisis Support
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-on-surface-variant/50"
        >
          <span className="text-xs font-medium">Explore</span>
          <motion.span
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="material-symbols-outlined text-[20px]"
          >
            keyboard_arrow_down
          </motion.span>
        </motion.div>
      </section>

      {/* Stats Bar */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeIn}
        className="px-6 md:px-16 py-16 bg-surface-container-lowest border-y border-outline-variant/20"
      >
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              custom={i}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-black text-primary mb-1">{s.value}</div>
              <div className="text-sm text-on-surface-variant font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Mental Health Awareness Banner */}
      <section className="px-6 md:px-16 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="relative max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center"
        >
          <motion.div variants={fadeUp} custom={0}>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 block">Why MindCare?</span>
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4 leading-tight">
              Mental health is not a luxury.{" "}
              <span className="text-primary">It&apos;s a necessity.</span>
            </h2>
            <p className="text-on-surface-variant leading-relaxed mb-6">
              1 in 4 university students experience mental health challenges. Most suffer in silence because
              traditional support is inaccessible, stigmatized, or overwhelmed. MindCare AI bridges that gap
              with technology that cares.
            </p>
            <div className="space-y-3">
              {[
                "Confidential ΓÇö no one sees your data without consent",
                "Evidence-based PHQ-9 with AI-enhanced analysis",
                "Instant access ΓÇö no waiting lists, no appointments",
                "Multilingual support in English, Luganda, Runyankore & Swahili",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="material-symbols-outlined icon-fill text-secondary text-[20px] mt-0.5 shrink-0">check_circle</span>
                  <span className="text-sm text-on-surface">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="relative">
            <div className="bg-gradient-to-br from-primary-container/40 to-secondary-container/40 rounded-3xl p-8 border border-outline-variant/30 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/20">
                  <span className="material-symbols-outlined text-primary text-[28px] mb-2">mood</span>
                  <div className="text-2xl font-black text-on-surface">87%</div>
                  <div className="text-xs text-on-surface-variant">Mood Improvement</div>
                </div>
                <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/20">
                  <span className="material-symbols-outlined text-secondary text-[28px] mb-2">timer</span>
                  <div className="text-2xl font-black text-on-surface">&lt;3min</div>
                  <div className="text-xs text-on-surface-variant">Daily Check-in</div>
                </div>
                <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/20">
                  <span className="material-symbols-outlined text-error text-[28px] mb-2">shield</span>
                  <div className="text-2xl font-black text-on-surface">256-bit</div>
                  <div className="text-xs text-on-surface-variant">Encryption</div>
                </div>
                <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/20">
                  <span className="material-symbols-outlined text-primary text-[28px] mb-2">neurology</span>
                  <div className="text-2xl font-black text-on-surface">NLP</div>
                  <div className="text-xs text-on-surface-variant">AI Analysis</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-6 md:px-16 py-20 bg-surface-container-lowest/50">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-5xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-secondary mb-3 block">Platform Features</span>
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-3">
              Everything you need to thrive
            </h2>
            <p className="text-on-surface-variant text-lg max-w-xl mx-auto">
              Comprehensive mental health tools designed for students, powered by AI.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} custom={i + 1}>
                <Link
                  href={f.href}
                  className={`group block bg-gradient-to-br ${f.gradient} border border-outline-variant/30 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${f.iconBg} mb-4`}>
                    <span className="material-symbols-outlined icon-fill text-[22px]">{f.icon}</span>
                  </div>
                  <h3 className="text-base font-semibold text-on-surface mb-2 group-hover:text-primary transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{f.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-6 md:px-16 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-5xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-secondary mb-3 block">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-3">
              Trusted by students and professionals
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                custom={i + 1}
                className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="material-symbols-outlined icon-fill text-secondary text-[16px]">star</span>
                  ))}
                </div>
                <p className="text-on-surface text-sm leading-relaxed mb-5 italic">
                  &quot;{t.quote}&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-on-surface">{t.name}</div>
                    <div className="text-xs text-on-surface-variant">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Counsellor CTA */}
      <section id="counsellors" className="px-6 md:px-16 py-20 bg-gradient-to-br from-primary/5 via-surface to-secondary/5">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-5xl mx-auto"
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 md:p-12 shadow-sm flex flex-col md:flex-row items-center gap-8"
          >
            <div className="flex-1">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary-container text-on-secondary-container text-xs font-semibold rounded-full mb-4">
                <span className="material-symbols-outlined text-[14px]">medical_information</span>
                For Counsellors
              </span>
              <h3 className="text-2xl md:text-3xl font-bold text-on-surface mb-3">
                Are you a mental health professional?
              </h3>
              <p className="text-on-surface-variant leading-relaxed mb-6">
                Access AI-powered risk analytics, case management tools, and longitudinal student data
                to deliver proactive, data-informed care. Monitor caseloads, receive critical alerts, and
                collaborate securely.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/auth/sign-in?role=counsellor"
                  className="px-6 py-3 bg-primary text-on-primary font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 justify-center"
                >
                  <span className="material-symbols-outlined text-[20px]">login</span>
                  Counsellor Sign In
                </Link>
                <Link
                  href="/auth/sign-up?role=counsellor"
                  className="px-6 py-3 border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-container-low transition-all flex items-center gap-2 justify-center"
                >
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                  Register
                </Link>
              </div>
            </div>
            <div className="shrink-0 hidden md:block">
              <div className="w-48 h-48 bg-gradient-to-br from-secondary-container to-primary-container rounded-3xl flex items-center justify-center border border-outline-variant/20">
                <span className="material-symbols-outlined icon-fill text-primary text-[80px]">monitoring</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Languages & Final CTA */}
      <section className="px-6 md:px-16 py-20 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-3xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0}>
            <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4 block">
              Multilingual Support
            </span>
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {["English", "Runyankore", "Luganda", "Swahili"].map((lang) => (
                <span
                  key={lang}
                  className="px-4 py-2 bg-surface-container-low rounded-full text-sm font-medium text-on-surface border border-outline-variant/40"
                >
                  {lang}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} custom={1}>
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4">
              Ready to prioritize your wellbeing?
            </h2>
            <p className="text-on-surface-variant text-lg mb-8">
              Join thousands of students already using MindCare AI. Free, confidential, and available 24/7.
            </p>
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-on-primary font-semibold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <span className="material-symbols-outlined text-[22px]">rocket_launch</span>
              Get Started ΓÇö It&apos;s Free
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}