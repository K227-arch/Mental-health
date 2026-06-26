"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Footer from "../components/Footer";
import { insforge } from "@/lib/insforge";
import { getLang, tr } from "@/app/lib/i18n";

const GROUNDING_STEPS = [
  { num: 5, sense: "see", icon: "visibility" },
  { num: 4, sense: "touch", icon: "touch_app" },
  { num: 3, sense: "hear", icon: "hearing" },
  { num: 2, sense: "smell", icon: "air" },
  { num: 1, sense: "taste", icon: "restaurant" },
];

const HOPE_MESSAGES = [
  { text: "You have survived 100% of your hardest days.", bg: "bg-primary-container", gradient: "from-primary to-secondary", textClass: "text-on-primary" },
  { text: "This feeling is temporary, but your strength is permanent.", bg: "bg-secondary-container", gradient: "from-secondary to-primary", textClass: "text-on-secondary-container" },
  { text: "It's okay to not be okay. Healing is not linear.", bg: "bg-surface-container-high", gradient: "from-outline to-surface-variant", textClass: "text-on-surface" },
  { text: "You are more than your current struggle.", bg: "bg-primary", gradient: "from-primary-fixed-dim to-primary", textClass: "text-on-primary" },
  { text: "One step at a time. You don't have to have it all figured out.", bg: "bg-secondary", gradient: "from-secondary-fixed-dim to-secondary", textClass: "text-on-secondary" },
  { text: "Asking for help is a sign of incredible strength.", bg: "bg-tertiary-fixed", gradient: "from-tertiary-fixed-dim to-tertiary-fixed", textClass: "text-on-tertiary-fixed" },
];

export default function CrisisPage() {
  const [activeTab, setActiveTab] = useState<"breathing" | "grounding" | "distraction">("breathing");
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [breathCount, setBreathCount] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [safetyPlan, setSafetyPlan] = useState<{ coping_strategies: string[]; support_contacts: Array<{ name: string; phone: string }> } | null>(null);
  const [showSafetyPlan, setShowSafetyPlan] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [lang, setLang] = useState<"en" | "sw" | "lg" | "rny">("en");

  useEffect(() => {
    setLang(getLang());
    insforge.auth.getCurrentUser().then(({ data }) => {
      if (data?.user) {
        setUserId(data.user.id);
        // Load safety plan
        insforge.database.from("crisis_safety_plans")
          .select()
          .eq("user_id", data.user.id)
          .maybeSingle()
          .then(({ data: plan }) => {
            if (plan) setSafetyPlan(plan as any);
          });
      }
    });
  }, []);

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

  const startEmergencyChat = async () => {
    setChatStarted(true);

    if (userId) {
      // Create or find active session
      const { data: existing } = await insforge.database
        .from("counsellor_sessions")
        .select()
        .eq("student_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (!existing) {
        await insforge.database.from("counsellor_sessions").insert([{
          student_id: userId,
          counsellor_id: "counsellor",
          status: "active",
          risk_level: "Critical",
          student_name: "Student (Crisis)",
        }]);
      }

      // Notify counsellor urgently
      await insforge.database.from("notifications").insert([{
        user_id: "counsellor",
        title: "🚨 EMERGENCY: Student in Crisis",
        body: "A student has triggered the emergency chat. Immediate response required.",
        type: "critical",
        link: "/counsellor",
      }]);

      setChatMsg("Crisis alert sent to your counsellor. They will respond shortly. If this is a life-threatening emergency, please call 988 or 0800-HELP immediately.");
    }
  };

  const toggleGroundingStep = (num: number) => {
    setCompletedSteps(prev =>
      prev.includes(num) ? prev.filter(s => s !== num) : [...prev, num]
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Hero */}
      <header className="relative w-full min-h-[280px] md:min-h-[360px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/20 via-secondary/10 to-surface" />
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary-fixed/30 to-secondary-container/20" />
        <div className="relative z-20 text-center px-6 max-w-4xl mx-auto w-full py-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-error text-on-error rounded-full text-sm font-semibold mb-4">
            <span className="material-symbols-outlined icon-fill text-[18px]">emergency</span>
            Crisis Support — Available 24/7
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-primary mb-4 leading-tight">
            {tr("youAreNotAlone", lang)}
          </h1>
          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
            Immediate Mental Health Crisis Resources. Confidential. Available 24/7.
          </p>
        </div>
      </header>

      <main className="flex-grow relative z-30 -mt-12 px-4 md:px-16 pb-20 w-full max-w-6xl mx-auto">

        {/* Chat alert banner */}
        {chatMsg && (
          <div className="mb-6 bg-primary-container border border-primary-fixed-dim rounded-xl p-4 flex items-start gap-3 animate-fade-in">
            <span className="material-symbols-outlined icon-fill text-primary text-[22px] shrink-0">support_agent</span>
            <div>
              <p className="text-sm font-semibold text-on-surface mb-1">Counsellor Notified</p>
              <p className="text-sm text-on-surface-variant">{chatMsg}</p>
            </div>
          </div>
        )}

        {/* Urgent Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
          <a href="tel:0800-HELP"
            className="group block w-full bg-error rounded-xl p-6 shadow-sm transition-transform active:scale-95 hover:-translate-y-1 relative overflow-hidden focus:outline-none focus:ring-4 focus:ring-error-container">
            <div className="absolute -right-8 -top-8 bg-on-error/10 w-32 h-32 rounded-full blur-xl group-hover:bg-on-error/20 transition-colors" />
            <div className="flex items-start gap-5 relative z-10">
              <div className="w-12 h-12 rounded-full bg-on-error text-error flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined icon-fill text-[28px]">phone_in_talk</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-on-error mb-1">Call Crisis Line</h2>
                <p className="text-on-error/90 text-sm mb-3">Connect immediately with a trained counsellor.</p>
                <div className="inline-flex items-center gap-1 text-sm text-on-error bg-on-error/20 px-3 py-1 rounded-full">
                  <span>0800-HELP</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </div>
              </div>
            </div>
          </a>

          <button onClick={startEmergencyChat} disabled={chatStarted}
            className="group block w-full bg-primary rounded-xl p-6 shadow-sm transition-transform active:scale-95 hover:-translate-y-1 relative overflow-hidden text-left focus:outline-none focus:ring-4 focus:ring-primary-fixed disabled:opacity-80">
            <div className="absolute -right-8 -bottom-8 bg-on-primary/10 w-32 h-32 rounded-full blur-xl group-hover:bg-on-primary/20 transition-colors" />
            <div className="flex items-start gap-5 relative z-10">
              <div className="w-12 h-12 rounded-full bg-on-primary text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined icon-fill text-[28px]">{chatStarted ? "check_circle" : "chat"}</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-on-primary mb-1">
                  {chatStarted ? "Counsellor Notified ✓" : "Start Emergency Chat"}
                </h2>
                <p className="text-on-primary/90 text-sm mb-3">
                  {chatStarted ? "Your counsellor has been alerted. You can also message them directly." : "Alert your counsellor instantly. Confidential."}
                </p>
                {!chatStarted && (
                  <div className="inline-flex items-center gap-1 text-sm text-on-primary bg-on-primary/20 px-3 py-1 rounded-full">
                    <span>Alert Counsellor</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </div>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Safety Plan Banner */}
        <div className="w-full mb-8">
          <button onClick={() => setShowSafetyPlan(!showSafetyPlan)}
            className="w-full bg-secondary-container border border-secondary-fixed-dim rounded-xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors hover:bg-secondary-fixed focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2">
            <div className="flex items-center gap-3 text-on-secondary-container">
              <span className="material-symbols-outlined text-[24px]">health_and_safety</span>
              <div className="text-left">
                <span className="block text-sm font-semibold">Personal Safety Plan</span>
                <span className="block text-sm opacity-80">
                  {safetyPlan ? "Access your coping strategies and contacts." : "No safety plan on file — create one with your counsellor."}
                </span>
              </div>
            </div>
            <span className="text-sm font-medium text-on-secondary-container bg-surface-container-lowest px-5 py-2 rounded-full shadow-sm whitespace-nowrap">
              {showSafetyPlan ? "Hide Plan" : "View Plan"}
            </span>
          </button>

          {showSafetyPlan && (
            <div className="mt-3 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 animate-fade-in">
              {safetyPlan ? (
                <div className="space-y-4">
                  {safetyPlan.coping_strategies?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-on-surface mb-2">Coping Strategies</h4>
                      <ul className="space-y-1">
                        {safetyPlan.coping_strategies.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-on-surface-variant">
                            <span className="material-symbols-outlined text-secondary text-[16px] mt-0.5 shrink-0">check_circle</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {safetyPlan.support_contacts?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-on-surface mb-2">Emergency Contacts</h4>
                      <div className="space-y-2">
                        {safetyPlan.support_contacts.map((c, i) => (
                          <a key={i} href={`tel:${c.phone}`} className="flex items-center justify-between p-3 bg-surface-container rounded-lg hover:bg-primary-container/20 transition-colors">
                            <span className="text-sm font-medium text-on-surface">{c.name}</span>
                            <span className="text-sm text-primary font-semibold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">call</span>
                              {c.phone}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <Link href="/safety-plan" className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline mt-2">
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    Edit Safety Plan
                  </Link>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-on-surface-variant mb-3">You don't have a safety plan yet.</p>
                  <Link href="/safety-plan" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Create My Safety Plan
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stabilization + Professional Support */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Stabilization Tools */}
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 flex flex-col shadow-sm">
            <div className="flex items-center gap-3 mb-4 text-primary">
              <span className="material-symbols-outlined">grid_view</span>
              <h3 className="text-xl font-semibold">Stabilization Tools</h3>
            </div>
            <p className="text-on-surface-variant text-sm mb-4">Choose a tool to help regain focus and calm.</p>

            {/* Tab switcher */}
            <div className="flex gap-1 mb-5 bg-surface-container rounded-xl p-1">
              {(["breathing", "grounding", "distraction"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${activeTab === tab ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Breathing */}
            {activeTab === "breathing" && (
              <div className="flex flex-col items-center gap-4 animate-fade-in">
                <div className="flex justify-center items-center h-44 w-full bg-surface-bright rounded-xl border border-surface-container-high relative overflow-hidden">
                  <div className={`w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center transition-all duration-[4000ms] ease-in-out ${breathPhase === "inhale" ? "scale-[1.6] opacity-80" : breathPhase === "hold" ? "scale-[1.6] opacity-90" : "scale-100 opacity-40"}`}>
                    <div className="w-12 h-12 rounded-full bg-secondary/40" />
                  </div>
                  <span className="absolute bottom-3 text-xs text-secondary uppercase tracking-widest opacity-70">
                    {isBreathing
                      ? breathPhase === "inhale" ? "Breathe In..." : breathPhase === "hold" ? "Hold..." : "Breathe Out..."
                      : "Press Start"}
                  </span>
                  {breathCount > 0 && (
                    <span className="absolute top-3 right-3 text-xs bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full">
                      {breathCount}/5
                    </span>
                  )}
                </div>
                {!isBreathing ? (
                  <button onClick={startBreathing} className="px-6 py-2.5 bg-secondary text-on-secondary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                    Start Breathing Exercise
                  </button>
                ) : (
                  <p className="text-xs text-on-surface-variant text-center">4 sec in → 2 sec hold → 4 sec out</p>
                )}
                {breathCount >= 5 && (
                  <p className="text-sm text-secondary font-medium animate-fade-in">✓ Exercise complete. Well done.</p>
                )}
              </div>
            )}

            {/* Grounding */}
            {activeTab === "grounding" && (
              <div className="space-y-2 animate-fade-in">
                <p className="text-xs text-on-surface-variant mb-3">Name things for each sense to ground yourself:</p>
                {GROUNDING_STEPS.map(step => (
                  <button key={step.num} onClick={() => toggleGroundingStep(step.num)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${completedSteps.includes(step.num) ? "bg-secondary-container border-secondary text-on-secondary-container" : "bg-surface-bright border-surface-container-high hover:bg-secondary-container/30"}`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${completedSteps.includes(step.num) ? "bg-secondary text-on-secondary" : "bg-secondary-container text-on-secondary-container"}`}>
                      {step.num}
                    </span>
                    <span className="material-symbols-outlined text-[18px]">{step.icon}</span>
                    <span className="text-sm font-medium">Things you can {step.sense}</span>
                    {completedSteps.includes(step.num) && (
                      <span className="ml-auto material-symbols-outlined icon-fill text-secondary text-[18px]">check_circle</span>
                    )}
                  </button>
                ))}
                {completedSteps.length === 5 && (
                  <p className="text-sm text-secondary font-medium text-center mt-2 animate-fade-in">✓ Grounding complete. You're doing great.</p>
                )}
              </div>
            )}

            {/* Distraction */}
            {activeTab === "distraction" && (
              <div className="space-y-3 animate-fade-in">
                <p className="text-xs text-on-surface-variant mb-3">Try a quick mental challenge to shift focus:</p>
                <div className="bg-surface-bright border border-surface-container-high rounded-xl p-4 space-y-3">
                  {["Name 5 types of fruit you enjoy", "Count backwards from 100 by 7s", "Name 3 countries for each letter A, B, C", "Think of songs that start with the letter M", "Describe your perfect peaceful day in detail"].map(c => (
                    <div key={c} className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-secondary text-[18px] mt-0.5 shrink-0">check_circle</span>
                      <span className="text-sm">{c}</span>
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
            <div className="space-y-4 flex-grow">
              <div className="p-4 bg-surface-bright rounded-xl border border-surface-container-high">
                <h4 className="text-sm font-semibold text-on-surface mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">support_agent</span>
                  Your Counsellor
                </h4>
                <p className="text-sm text-on-surface-variant mb-3 leading-relaxed">
                  {chatStarted
                    ? "Your counsellor has been alerted and will follow up within 24 hours."
                    : "Click 'Start Emergency Chat' above to instantly alert your assigned counsellor."}
                </p>
                <Link href="/messages" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  Open Secure Chat
                </Link>
              </div>

              <div className="p-4 bg-surface-bright rounded-xl border border-surface-container-high">
                <h4 className="text-sm font-semibold text-on-surface mb-2">Campus Emergency Services</h4>
                <p className="text-sm text-on-surface-variant mb-3">For immediate physical safety on campus, contact Public Safety directly.</p>
                <a href="tel:999" className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  Call Campus Security
                </a>
              </div>

              <div className="p-4 bg-error-container/30 rounded-xl border border-error-container">
                <h4 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-[18px]">warning</span>
                  National Hotlines
                </h4>
                <div className="space-y-2">
                  {[
                    { label: "988 — Suicide & Crisis Lifeline", number: "988" },
                    { label: "0800-HELP — Crisis Helpline", number: "0800-HELP" },
                    { label: "Crisis Text Line: Text HOME to 741741", number: "741741" },
                  ].map(h => (
                    <a key={h.number} href={`tel:${h.number}`}
                      className="flex items-center gap-2 text-sm text-error font-semibold hover:underline">
                      <span className="material-symbols-outlined text-[16px]">phone</span>
                      {h.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Messages of Hope */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-primary">
            <span className="material-symbols-outlined">favorite</span>
            <h3 className="text-xl font-semibold">Messages of Hope</h3>
          </div>
          <p className="text-on-surface-variant text-sm mb-5">Small reminders that you are valued and resilient.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {HOPE_MESSAGES.map((msg, i) => (
              <div key={i} className={`relative overflow-hidden rounded-xl aspect-video flex items-center justify-center p-5 text-center ${msg.bg}`}>
                <div className={`absolute inset-0 opacity-40 bg-gradient-to-br ${msg.gradient}`} />
                <p className={`relative z-10 text-sm font-semibold leading-relaxed ${msg.textClass}`}>{msg.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
