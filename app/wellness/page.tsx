"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import StudentSidebar from "../components/StudentSidebar";
import { wellnessMilestones, hopeMessages } from "../lib/data";
import { useTranslation } from "../lib/i18n";

const resources = [
  {
    category: "Depression",
    icon: "psychology",
    color: "bg-primary-container text-on-primary-container",
    items: [
      "Understanding Depression: A Student Guide",
      "CBT Workbook — Thought Records",
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
    description: "Breathe in 4s → hold 4s → out 4s → hold 4s. Repeat 4 times.",
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
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<"exercises" | "shared" | "inspiration" | "hope">("exercises");
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [activeTimer, setActiveTimer] = useState<{ id: string; title: string; totalSeconds: number; remaining: number; running: boolean } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const parseDurationToSeconds = (duration: string): number => {
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1]) * 60 : 300;
  };

  const startExercise = (ex: { id: string; title: string; duration: string }) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const totalSeconds = parseDurationToSeconds(ex.duration);
    setActiveTimer({ id: ex.id, title: ex.title, totalSeconds, remaining: totalSeconds, running: true });
  };

  useEffect(() => {
    if (!activeTimer?.running) return;
    timerRef.current = setInterval(() => {
      setActiveTimer((prev) => {
        if (!prev) return null;
        const next = prev.remaining - 1;
        if (next <= 0) {
          clearInterval(timerRef.current!);
          // Mark as completed when timer runs out
          setCompletedExercises((c) => c.includes(prev.id) ? c : [...c, prev.id]);
          return { ...prev, remaining: 0, running: false };
        }
        return { ...prev, remaining: next };
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeTimer?.running, activeTimer?.id]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const progressPct = activeTimer ? ((activeTimer.totalSeconds - activeTimer.remaining) / activeTimer.totalSeconds) * 100 : 0;
  const [sharedResources, setSharedResources] = useState<any[]>([]);
  const [loadingShared, setLoadingShared] = useState(false);
  const [hopeIndex, setHopeIndex] = useState(0);

  // Auto-rotate hope images
  useEffect(() => {
    if (activeSection !== "hope") return;
    const interval = setInterval(() => {
      setHopeIndex((prev) => (prev + 1) % hopeMessages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeSection]);

  useEffect(() => {
    // Fetch shared resources for this student
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.user?.id) {
          setLoadingShared(true);
          fetch(`/api/resources?assignedTo=${d.user.id}`)
            .then((r) => r.ok ? r.json() : { resources: [] })
            .then((data) => {
              setSharedResources((data.resources || []).filter((r: any) => r.assigned_to));
              setLoadingShared(false);
            })
            .catch(() => setLoadingShared(false));
        }
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar variant="student" />

      <div className="flex flex-1 pt-16">
        <StudentSidebar />

        <main className="flex-1 overflow-y-auto">
        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-secondary-container/30 to-primary-container/20 px-6 md:px-20 py-16 text-center border-b border-outline-variant/30">
          <div className="max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-container text-sm font-semibold rounded-full mb-4">
              <span className="material-symbols-outlined text-[16px]">self_improvement</span>
              {t("wellness.journeyLabel")}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-on-surface mb-3">
              {t("wellness.hubTitle")}
            </h1>
            <p className="text-on-surface-variant leading-relaxed">
              {t("wellness.hubSubtitle")}
            </p>
          </div>
        </div>

        <div className="px-4 md:px-20 py-10 max-w-6xl mx-auto">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 bg-surface-container-low rounded-xl p-1.5 w-fit">
            {(["exercises", "shared", "inspiration", "hope"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSection(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${
                  activeSection === tab
                    ? "bg-surface-container-lowest text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {tab === "hope" ? "Hope Gallery" : tab === "shared" ? `Resources (${sharedResources.length})` : tab === "inspiration" ? "Inspiration" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Exercises */}
          {activeSection === "exercises" && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-on-surface mb-6">{t("wellness.exercisesTitle")}</h2>
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
                      onClick={() => {
                        if (completedExercises.includes(ex.id)) {
                          setCompletedExercises((prev) => prev.filter((e) => e !== ex.id));
                        } else {
                          startExercise(ex);
                        }
                      }}
                      className={`mt-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        completedExercises.includes(ex.id)
                          ? "bg-secondary-container text-on-secondary-container"
                          : "bg-primary text-on-primary hover:opacity-90"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {completedExercises.includes(ex.id) ? "check_circle" : "play_circle"}
                      </span>
                      {completedExercises.includes(ex.id) ? t("wellness.completed") : t("wellness.startExercise")}
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
              <h2 className="text-xl font-bold text-on-surface mb-6">{t("wellness.libraryTitle")}</h2>
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

          {/* Shared by Counsellor */}
          {activeSection === "shared" && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-on-surface mb-2">{t("wellness.sharedTitle")}</h2>
              <p className="text-on-surface-variant text-sm mb-6">{t("wellness.sharedSubtitle")}</p>

              {loadingShared ? (
                <div className="text-center py-12 text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
                </div>
              ) : sharedResources.length === 0 ? (
                <div className="text-center py-16 bg-surface-container-lowest border border-outline-variant rounded-xl">
                  <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 block mb-3">library_books</span>
                  <p className="text-sm text-on-surface-variant">{t("wellness.noShared")}</p>
                  <p className="text-xs text-on-surface-variant/60 mt-1">{t("wellness.noSharedDesc")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sharedResources.map((resource: any) => (
                    <div
                      key={resource.id}
                      className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold bg-secondary-container text-on-secondary-container">
                          {resource.category}
                        </span>
                        <span className="material-symbols-outlined text-[18px] text-secondary">
                          {resource.type === "video" ? "play_circle" : resource.type === "exercise" ? "self_improvement" : "article"}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-on-surface mb-2">{resource.title}</h3>
                      <p className="text-xs text-on-surface-variant mb-4 flex-1 leading-relaxed">{resource.description}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-outline-variant">
                        <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">schedule</span>
                          {resource.read_time || "5 min"}
                        </span>
                        {resource.content_url ? (
                          <a
                            href={resource.content_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                          >
                            Open
                            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          </a>
                        ) : (
                          <span className="text-xs text-on-surface-variant">No attachment</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Inspiration - Videos, Books, Music, Meditation */}
          {activeSection === "inspiration" && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-on-surface mb-2">{t("wellness.inspirationTitle")}</h2>
              <p className="text-on-surface-variant text-sm mb-6">{t("wellness.inspirationSubtitle")}</p>
              
              {/* Meditation Videos — real YouTube embeds */}
              <div className="mb-8">
                <h3 className="text-base font-semibold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">self_improvement</span>
                  Meditation & Relaxation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: "5-Minute Guided Meditation", duration: "5:00", desc: "A quick meditation to calm your mind", youtubeId: "inpok4MKVLM" },
                    { title: "Deep Sleep Relaxation", duration: "15:00", desc: "Soothing sounds to help you fall asleep", youtubeId: "1ZYbU82GVz4" },
                    { title: "Breathing for Anxiety", duration: "8:00", desc: "4-7-8 breathing technique guided session", youtubeId: "tybOi4hjZFQ" },
                  ].map((video) => (
                    <div key={video.title} className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-video w-full">
                        <iframe
                          src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0&modestbranding=1`}
                          title={video.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full rounded-t-xl"
                        />
                      </div>
                      <div className="p-3">
                        <h4 className="text-sm font-semibold text-on-surface">{video.title}</h4>
                        <p className="text-xs text-on-surface-variant mt-0.5">{video.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overcoming Stories */}
              <div>
                <h3 className="text-base font-semibold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">auto_stories</span>
                  Stories of Overcoming
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: "Sarah K.", story: "I went through severe depression in my 2nd year. Talking to someone and journaling saved me. Today I'm thriving.", avatar: "SK" },
                    { name: "James M.", story: "Anxiety almost made me drop out. Breathing techniques and counselling helped me graduate with honors.", avatar: "JM" },
                    { name: "Grace N.", story: "After losing a parent, grief consumed me. The Selfcare Hub community reminded me I'm not alone.", avatar: "GN" },
                    { name: "David O.", story: "Exam stress led to sleepless nights. Meditation and the wellness exercises here changed my routine.", avatar: "DO" },
                  ].map((person) => (
                    <div key={person.name} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-on-primary-container">{person.avatar}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-on-surface">{person.name}</h4>
                        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed italic">&ldquo;{person.story}&rdquo;</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Hope Gallery */}
          {activeSection === "hope" && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-on-surface mb-2">{t("wellness.hopeTitle")}</h2>
              <p className="text-on-surface-variant text-sm mb-6">{t("wellness.hopeSubtitle")}</p>

              {/* Slideshow */}
              <div className="relative w-full max-w-lg mx-auto">
                <div className="relative h-80 rounded-xl overflow-hidden">
                  {hopeMessages.map((msg, idx) => (
                    <div
                      key={msg.id}
                      className={`absolute inset-0 transition-all duration-700 ${
                        idx === hopeIndex ? "opacity-100 scale-100" : "opacity-0 scale-95"
                      }`}
                    >
                      <img src={msg.image} alt={msg.text} className="w-full h-full object-contain rounded-xl" />
                    </div>
                  ))}
                </div>

                {/* Navigation arrows */}
                <button
                  onClick={() => setHopeIndex((prev) => (prev - 1 + hopeMessages.length) % hopeMessages.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface/80 backdrop-blur-sm border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <button
                  onClick={() => setHopeIndex((prev) => (prev + 1) % hopeMessages.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface/80 backdrop-blur-sm border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>

                {/* Dots */}
                <div className="flex justify-center gap-1.5 mt-4">
                  {hopeMessages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setHopeIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-colors ${idx === hopeIndex ? "bg-primary" : "bg-outline-variant"}`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-8 p-6 bg-primary-container/20 border border-outline-variant/50 rounded-2xl text-center">
                <span className="material-symbols-outlined icon-fill text-primary text-[40px] mb-3 block">favorite</span>
                <h3 className="text-lg font-bold text-on-surface mb-2">{t("wellness.youMatter")}</h3>
                <p className="text-on-surface-variant text-sm max-w-md mx-auto mb-4">
                  {t("wellness.youMatterDesc")}
                </p>
                <Link
                  href="/crisis"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined icon-fill text-[18px]">emergency</span>
                  {t("wellness.getHelp")}
                </Link>
              </div>
            </div>
          )}
        </div>
        </main>
      </div>

      {/* Timer Modal */}
      {activeTimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 w-full max-w-sm shadow-xl animate-fade-in text-center">
            <h2 className="text-lg font-bold text-on-surface mb-1">{activeTimer.title}</h2>
            <p className="text-xs text-on-surface-variant mb-6">
              {activeTimer.remaining > 0 ? (activeTimer.running ? "In progress..." : "Paused") : "Complete! 🎉"}
            </p>
            <div className="relative w-40 h-40 mx-auto mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" className="text-surface-container-high" />
                <circle
                  cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8"
                  className={activeTimer.remaining === 0 ? "text-secondary" : "text-primary"}
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - progressPct / 100)}`}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-on-surface tabular-nums">{formatTime(activeTimer.remaining)}</span>
                <span className="text-xs text-on-surface-variant mt-1">remaining</span>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              {activeTimer.remaining > 0 && (
                <button
                  onClick={() => setActiveTimer((prev) => prev ? { ...prev, running: !prev.running } : null)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTimer.running ? "bg-surface-container-high text-on-surface" : "bg-primary text-on-primary"}`}
                >
                  <span className="material-symbols-outlined text-[18px]">{activeTimer.running ? "pause" : "play_arrow"}</span>
                  {activeTimer.running ? "Pause" : "Resume"}
                </button>
              )}
              {activeTimer.remaining === 0 && (
                <button onClick={() => setActiveTimer(null)} className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-on-secondary rounded-xl text-sm font-semibold">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Done!
                </button>
              )}
              <button
                onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setActiveTimer(null); }}
                className="flex items-center gap-2 px-5 py-2.5 border border-outline-variant bg-surface text-on-surface rounded-xl text-sm font-medium hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
