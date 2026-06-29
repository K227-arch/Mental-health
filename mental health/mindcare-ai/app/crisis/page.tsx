"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "../components/Footer";
import { hopeMessages } from "../lib/data";

const groundingSteps = [
  { num: 5, sense: "see", icon: "visibility", description: "Things you can see right now" },
  { num: 4, sense: "touch", icon: "touch_app", description: "Things you can physically touch" },
  { num: 3, sense: "hear", icon: "hearing", description: "Things you can hear around you" },
  { num: 2, sense: "smell", icon: "air", description: "Things you can smell" },
  { num: 1, sense: "taste", icon: "restaurant", description: "Thing you can taste" },
];

export default function CrisisPage() {
  const [activeTab, setActiveTab] = useState<"breathing" | "grounding" | "distraction">("breathing");
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [breathCount, setBreathCount] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const startBreathing = () => {
    setIsBreathing(true);
    let count = 0;
    const cycle = () => {
      setBreathPhase("inhale");
      setTimeout(() => {
        setBreathPhase("hold");
        setTimeout(() => {
          setBreathPhase("exhale");
          setTimeout(() => {
            count++;
            setBreathCount(count);
            if (count < 5) cycle();
            else setIsBreathing(false);
          }, 4000);
        }, 2000);
      }, 4000);
    };
    cycle();
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Hero */}
      <header className="relative w-full min-h-[300px] md:h-[40vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-secondary/10 to-surface" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed/30 to-secondary-container/20" />
        </div>
        <div className="relative z-20 text-center px-6 max-w-4xl mx-auto w-full py-16 md:py-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-error text-on-error rounded-full text-sm font-semibold mb-4">
            <span className="material-symbols-outlined icon-fill text-[18px]">emergency</span>
            Crisis Support — Available 24/7
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-primary mb-4 leading-tight">
            You are not alone.{" "}
            <br className="hidden md:block" />
            Help is here right now.
          </h1>
          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
            Immediate Mental Health Crisis Resources. Confidential. Available 24/7.
          </p>
        </div>
      </header>

      <main className="flex-grow relative z-30 -mt-16 px-4 md:px-20 pb-20 w-full max-w-6xl mx-auto">
        {/* Urgent Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
          {/* Call */}
          <a
            href="tel:0800-HELP"
            className="group block w-full bg-error rounded-xl p-6 shadow-sm transition-transform active:scale-95 hover:-translate-y-1 relative overflow-hidden focus:outline-none focus:ring-4 focus:ring-error-container"
          >
            <div className="absolute -right-8 -top-8 bg-on-error/10 w-32 h-32 rounded-full blur-xl group-hover:bg-on-error/20 transition-colors" />
            <div className="flex items-start gap-6 relative z-10">
              <div className="w-12 h-12 rounded-full bg-on-error text-error flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined icon-fill text-[28px]">phone_in_talk</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-on-error mb-1">Call Crisis Line</h2>
                <p className="text-on-error/90 text-sm mb-3">Connect immediately with a trained counselor.</p>
                <div className="inline-flex items-center gap-1 text-sm text-on-error bg-on-error/20 px-3 py-1 rounded-full">
                  <span>0800-HELP</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </div>
              </div>
            </div>
          </a>

          {/* Chat */}
          <Link
            href="/counsellor/chat"
            className="group block w-full bg-primary rounded-xl p-6 shadow-sm transition-transform active:scale-95 hover:-translate-y-1 relative overflow-hidden focus:outline-none focus:ring-4 focus:ring-primary-fixed"
          >
            <div className="absolute -right-8 -bottom-8 bg-on-primary/10 w-32 h-32 rounded-full blur-xl group-hover:bg-on-primary/20 transition-colors" />
            <div className="flex items-start gap-6 relative z-10">
              <div className="w-12 h-12 rounded-full bg-on-primary text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined icon-fill text-[28px]">chat</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-on-primary mb-1">Start Emergency Chat</h2>
                <p className="text-on-primary/90 text-sm mb-3">Text confidentially with a support specialist.</p>
                <div className="inline-flex items-center gap-1 text-sm text-on-primary bg-on-primary/20 px-3 py-1 rounded-full">
                  <span>Start Session</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Safety Plan Banner */}
        <div className="w-full mb-8">
          <button className="w-full bg-secondary-container border border-secondary-fixed-dim rounded-xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors hover:bg-secondary-fixed focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2">
            <div className="flex items-center gap-3 text-on-secondary-container">
              <span className="material-symbols-outlined text-[24px]">health_and_safety</span>
              <div className="text-left">
                <span className="block text-sm font-semibold">Personal Safety Plan</span>
                <span className="block text-sm opacity-80">Access your pre-filled coping strategies and contacts.</span>
              </div>
            </div>
            <span className="text-sm font-medium text-on-secondary-container bg-surface-container-lowest px-5 py-2 rounded-full shadow-sm whitespace-nowrap">
              View Plan
            </span>
          </button>
        </div>

        {/* Stabilization Tools + Professional Support */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Stabilization */}
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 flex flex-col shadow-sm">
            <div className="flex items-center gap-3 mb-4 text-primary">
              <span className="material-symbols-outlined">grid_view</span>
              <h3 className="text-xl font-semibold">Stabilization Tools</h3>
            </div>
            <p className="text-on-surface-variant text-sm mb-5">
              Choose a tool to help regain focus and calm.
            </p>

            {/* Tabs */}
            <div className="flex gap-2 mb-5 bg-surface-container rounded-xl p-1">
              {(["breathing", "grounding", "distraction"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    activeTab === tab
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Breathing */}
            {activeTab === "breathing" && (
              <div className="flex flex-col items-center gap-4 animate-fade-in">
                <div className="flex justify-center items-center h-44 w-full bg-surface-bright rounded-xl border border-surface-container-high relative overflow-hidden">
                  <div
                    className={`w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center transition-all duration-1000 ${
                      breathPhase === "inhale" ? "scale-125 opacity-80" : breathPhase === "hold" ? "scale-125 opacity-90" : "scale-100 opacity-40"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-secondary/40" />
                  </div>
                  <span className="absolute bottom-3 text-xs text-secondary uppercase tracking-widest opacity-70">
                    {isBreathing
                      ? breathPhase === "inhale"
                        ? "Breathe In..."
                        : breathPhase === "hold"
                        ? "Hold..."
                        : "Breathe Out..."
                      : "Breathe"}
                  </span>
                  {breathCount > 0 && (
                    <span className="absolute top-3 right-3 text-xs bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full">
                      {breathCount}/5
                    </span>
                  )}
                </div>
                {!isBreathing ? (
                  <button
                    onClick={startBreathing}
                    className="px-6 py-2.5 bg-secondary text-on-secondary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    Start Breathing Exercise
                  </button>
                ) : (
                  <p className="text-xs text-on-surface-variant text-center">
                    Breathe in for 4 seconds → Hold for 2 → Breathe out for 4
                  </p>
                )}
              </div>
            )}

            {/* Grounding */}
            {activeTab === "grounding" && (
              <div className="space-y-2 animate-fade-in">
                <p className="text-xs text-on-surface-variant mb-3">
                  Name things for each sense to ground yourself in the present moment:
                </p>
                {groundingSteps.map((step) => (
                  <button
                    key={step.num}
                    onClick={() =>
                      setCompletedSteps((prev) =>
                        prev.includes(step.num) ? prev.filter((s) => s !== step.num) : [...prev, step.num]
                      )
                    }
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      completedSteps.includes(step.num)
                        ? "bg-secondary-container border-secondary text-on-secondary-container"
                        : "bg-surface-bright border-surface-container-high hover:bg-secondary-container/30"
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      completedSteps.includes(step.num) ? "bg-secondary text-on-secondary" : "bg-secondary-container text-on-secondary-container"
                    }`}>
                      {step.num}
                    </span>
                    <div className="text-left">
                      <span className="text-sm font-medium">Things you can {step.sense}</span>
                    </div>
                    {completedSteps.includes(step.num) && (
                      <span className="ml-auto material-symbols-outlined icon-fill text-secondary text-[18px]">check_circle</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Distraction */}
            {activeTab === "distraction" && (
              <div className="space-y-3 animate-fade-in">
                <p className="text-xs text-on-surface-variant mb-3">Try a quick mental challenge:</p>
                <div className="bg-surface-bright border border-surface-container-high rounded-xl p-4 space-y-3">
                  {[
                    "Name 5 types of fruit you enjoy",
                    "Count backwards from 100 by 7s",
                    "Name 3 countries for each letter A, B, C",
                    "Think of songs that start with the letter M",
                    "Describe your perfect day in detail",
                  ].map((challenge) => (
                    <div key={challenge} className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-secondary text-[18px] mt-0.5 shrink-0">check_circle</span>
                      <span className="text-sm">{challenge}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Professional Support */}
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 flex flex-col shadow-sm">
            <div className="flex items-center gap-3 mb-4 text-primary">
              <span className="material-symbols-outlined">local_hospital</span>
              <h3 className="text-xl font-semibold">Professional Support</h3>
            </div>

            <div className="space-y-5 flex-grow">
              <div className="p-4 bg-surface-bright rounded-xl border border-surface-container-high">
                <h4 className="text-sm font-semibold text-on-surface mb-2">Counselor Notification</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  If you initiate an emergency chat, your assigned university counselor will be securely notified to follow up within 24 hours. This ensures continuous care.
                </p>
              </div>

              <div className="p-4 bg-surface-bright rounded-xl border border-surface-container-high">
                <h4 className="text-sm font-semibold text-on-surface mb-2">Campus Emergency Services</h4>
                <p className="text-sm text-on-surface-variant mb-3">
                  For immediate physical safety concerns on campus, contact Public Safety directly.
                </p>
                <button className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-container transition-colors">
                  <span className="material-symbols-outlined text-[18px]">call</span>
                  Call Campus Security
                </button>
              </div>

              <div className="p-4 bg-error-container/30 rounded-xl border border-error-container">
                <h4 className="text-sm font-semibold text-on-surface mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-[18px]">warning</span>
                  National Hotlines
                </h4>
                <div className="space-y-2">
                  <a href="tel:988" className="flex items-center gap-2 text-sm text-error font-semibold hover:underline">
                    <span className="material-symbols-outlined text-[16px]">phone</span>
                    988 — Suicide & Crisis Lifeline
                  </a>
                  <a href="tel:0800-HELP" className="flex items-center gap-2 text-sm text-error font-semibold hover:underline">
                    <span className="material-symbols-outlined text-[16px]">phone</span>
                    0800-HELP — Crisis Helpline
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Hope Gallery */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-primary">
            <span className="material-symbols-outlined">favorite</span>
            <h3 className="text-xl font-semibold">Messages of Hope</h3>
          </div>
          <p className="text-on-surface-variant text-sm mb-5">Small reminders that you are valued and resilient.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hopeMessages.map((msg) => (
              <div
                key={msg.id}
                className={`relative overflow-hidden rounded-xl aspect-video flex items-center justify-center p-5 text-center ${msg.colorClass}`}
              >
                <div className={`absolute inset-0 opacity-40 bg-gradient-to-br ${msg.gradientClass}`} />
                <p className={`relative z-10 text-sm font-semibold leading-relaxed ${msg.textClass}`}>
                  {msg.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
