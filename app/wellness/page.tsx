"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { wellnessMilestones, hopeMessages } from "../lib/data";

const resources = [
  {
    category: "Depression",
    icon: "psychology",
    color: "bg-primary-container text-on-primary-container",
    items: [
      "Understanding Depression: A Student Guide",
      "CBT Workbook ΓÇö Thought Records",
      "Behavioural Activation Techniques",
      "Overcoming Academic Pressure",
    ],
  },
  {
    category: "Anxiety",
    icon: "air",
    color: "bg-secondary-container text-on-secondary-container",
    items: [
      "Managing Exam Anxiety",
      "Relaxation & Breathing Techniques",
      "Progressive Muscle Relaxation Guide",
      "Social Anxiety Coping Strategies",
    ],
  },
  {
    category: "Sleep & Rest",
    icon: "hotel",
    color: "bg-tertiary-fixed text-on-tertiary-fixed",
    items: [
      "Sleep Hygiene for Students",
      "Wind-Down Routine Planner",
      "Managing Late-Night Anxiety",
      "Nap vs Full Sleep Guide",
    ],
  },
  {
    category: "Resilience",
    icon: "self_improvement",
    color: "bg-surface-container-high text-on-surface",
    items: [
      "Building Mental Resilience",
      "Mindfulness 101",
      "Journaling for Mental Health",
      "Gratitude Practice Guide",
    ],
  },
];

const exercises = [
  {
    id: "1",
    title: "Box Breathing",
    duration: "5 min",
    icon: "air",
    description: "Breathe in 4s ΓåÆ hold 4s ΓåÆ out 4s ΓåÆ hold 4s. Repeat 4 times.",
    color: "bg-secondary-container text-on-secondary-container",
  },
  {
    id: "2",
    title: "Body Scan Meditation",
    duration: "10 min",
    icon: "self_improvement",
    description: "Slowly move awareness through each part of your body, releasing tension.",
    color: "bg-primary-container text-on-primary-container",
  },
  {
    id: "3",
    title: "Mindful Walk",
    duration: "15 min",
    icon: "directions_walk",
    description: "Take a slow walk, noticing 3 things you see, hear, and feel with each step.",
    color: "bg-tertiary-fixed text-on-tertiary-fixed",
  },
  {
    id: "4",
    title: "Journaling Prompt",
    duration: "10 min",
    icon: "edit_note",
    description: "Write freely about: What went well today? What am I grateful for?",
    color: "bg-surface-container-high text-on-surface",
  },
];

export default function WellnessPage() {
  const [activeSection, setActiveSection] = useState<"exercises" | "resources" | "milestones" | "hope">("exercises");
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar variant="student" />

      <main className="flex-1 pt-16">
        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-secondary-container/30 to-primary-container/20 px-6 md:px-20 py-16 text-center border-b border-outline-variant/30">
          <div className="max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-container text-sm font-semibold rounded-full mb-4">
              <span className="material-symbols-outlined text-[16px]">self_improvement</span>
              Your Wellness Journey
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-on-surface mb-3">
              Your Wellness Hub
            </h1>
            <p className="text-on-surface-variant leading-relaxed">
              Tools, exercises, and resources to support your mental wellbeing ΓÇö at your own pace.
            </p>
          </div>
        </div>

        <div className="px-4 md:px-20 py-10 max-w-6xl mx-auto">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 bg-surface-container-low rounded-xl p-1.5 w-fit">
            {(["exercises", "resources", "milestones", "hope"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSection(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${
                  activeSection === tab
                    ? "bg-surface-container-lowest text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {tab === "hope" ? "Hope Gallery" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Exercises */}
          {activeSection === "exercises" && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-on-surface mb-6">Wellness Exercises</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {exercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ex.color}`}>
                        <span className="material-symbols-outlined icon-fill text-[22px]">{ex.icon}</span>
                      </div>
                      <span className="text-xs bg-surface-container text-on-surface-variant px-3 py-1 rounded-full">
                        {ex.duration}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-on-surface mb-1">{ex.title}</h3>
                      <p className="text-sm text-on-surface-variant leading-relaxed">{ex.description}</p>
                    </div>
                    <button
                      onClick={() =>
                        setCompletedExercises((prev) =>
                          prev.includes(ex.id) ? prev.filter((e) => e !== ex.id) : [...prev, ex.id]
                        )
                      }
                      className={`mt-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        completedExercises.includes(ex.id)
                          ? "bg-secondary-container text-on-secondary-container"
                          : "bg-primary text-on-primary hover:opacity-90"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {completedExercises.includes(ex.id) ? "check_circle" : "play_circle"}
                      </span>
                      {completedExercises.includes(ex.id) ? "Completed" : "Start Exercise"}
                    </button>
                  </div>
                ))}
              </div>

              {completedExercises.length > 0 && (
                <div className="mt-6 p-4 bg-secondary-container/30 border border-secondary-fixed-dim rounded-xl flex items-center gap-3 animate-fade-in">
                  <span className="material-symbols-outlined icon-fill text-secondary text-[28px]">emoji_events</span>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">
                      Great work! {completedExercises.length} exercise{completedExercises.length > 1 ? "s" : ""} completed today.
                    </p>
                    <p className="text-xs text-on-surface-variant">Your progress is being tracked.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resources */}
          {activeSection === "resources" && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-on-surface mb-6">Wellness Library</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {resources.map((cat) => (
                  <div key={cat.category} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.color}`}>
                        <span className="material-symbols-outlined icon-fill text-[22px]">{cat.icon}</span>
                      </div>
                      <h3 className="text-base font-semibold text-on-surface">{cat.category}</h3>
                    </div>
                    <div className="space-y-2">
                      {cat.items.map((item) => (
                        <button
                          key={item}
                          className="w-full text-left flex items-center gap-2 px-3 py-2.5 bg-surface-bright border border-surface-container-high rounded-lg hover:bg-surface-container transition-colors group"
                        >
                          <span className="material-symbols-outlined text-secondary text-[16px] shrink-0">article</span>
                          <span className="text-sm text-on-surface flex-1">{item}</span>
                          <span className="material-symbols-outlined text-on-surface-variant text-[16px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            arrow_forward
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Milestones */}
          {activeSection === "milestones" && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-on-surface mb-2">Wellness Milestones</h2>
              <p className="text-on-surface-variant text-sm mb-6">Track your progress and earn badges for your wellness journey.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  ...wellnessMilestones,
                  { id: "5", title: "Crisis Navigator", description: "Used crisis tools during a hard moment", icon: "health_and_safety", earned: false, color: "bg-surface-variant text-on-surface-variant" },
                  { id: "6", title: "Daily Checker", description: "Completed 7 daily check-ins", icon: "task_alt", earned: true, color: "bg-error-container text-on-error-container" },
                ].map((m) => (
                  <div
                    key={m.id}
                    className={`bg-surface-container-lowest rounded-xl border p-5 flex items-start gap-4 ${
                      m.earned ? "border-outline-variant" : "border-dashed border-outline-variant opacity-60"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${m.color}`}>
                      <span className="material-symbols-outlined icon-fill text-[22px]">{m.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-on-surface">{m.title}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{m.description}</p>
                      {m.earned ? (
                        <span className="inline-flex items-center gap-1 text-xs text-secondary font-medium mt-2">
                          <span className="material-symbols-outlined icon-fill text-[14px]">check_circle</span>
                          Earned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant mt-2">
                          <span className="material-symbols-outlined text-[14px]">lock</span>
                          Locked
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hope Gallery */}
          {activeSection === "hope" && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-on-surface mb-2">Messages of Hope</h2>
              <p className="text-on-surface-variant text-sm mb-6">Reminders that you are valued and resilient.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {hopeMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`relative overflow-hidden rounded-xl aspect-video flex items-center justify-center p-6 text-center ${msg.colorClass}`}
                  >
                    <div className={`absolute inset-0 opacity-40 bg-gradient-to-br ${msg.gradientClass}`} />
                    <p className={`relative z-10 text-sm font-semibold leading-relaxed ${msg.textClass}`}>
                      "{msg.text}"
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-primary-container/20 border border-outline-variant/50 rounded-2xl text-center">
                <span className="material-symbols-outlined icon-fill text-primary text-[40px] mb-3 block">favorite</span>
                <h3 className="text-lg font-bold text-on-surface mb-2">You matter. You belong here.</h3>
                <p className="text-on-surface-variant text-sm max-w-md mx-auto mb-4">
                  Every step you take towards your wellbeing is an act of courage. We're here for you.
                </p>
                <Link
                  href="/crisis"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined icon-fill text-[18px]">emergency</span>
                  Get Immediate Help
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}