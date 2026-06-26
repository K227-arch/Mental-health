"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { insforge } from "@/lib/insforge";
import type { WellnessActivity } from "@/lib/insforge";

const RESOURCES = [
  { category: "Depression", icon: "psychology", color: "bg-primary-container text-on-primary-container", items: ["Understanding Depression: A Student Guide", "CBT Workbook — Thought Records", "Behavioural Activation Techniques", "Overcoming Academic Pressure"] },
  { category: "Anxiety", icon: "air", color: "bg-secondary-container text-on-secondary-container", items: ["Managing Exam Anxiety", "Relaxation & Breathing Techniques", "Progressive Muscle Relaxation Guide", "Social Anxiety Coping Strategies"] },
  { category: "Sleep & Rest", icon: "hotel", color: "bg-tertiary-fixed text-on-tertiary-fixed", items: ["Sleep Hygiene for Students", "Wind-Down Routine Planner", "Managing Late-Night Anxiety", "Nap vs Full Sleep Guide"] },
  { category: "Resilience", icon: "self_improvement", color: "bg-surface-container-high text-on-surface", items: ["Building Mental Resilience", "Mindfulness 101", "Journaling for Mental Health", "Gratitude Practice Guide"] },
];

const EXERCISES = [
  { id: "breathing", title: "Box Breathing", duration: "5 min", icon: "air", description: "Breathe in 4s → hold 4s → out 4s → hold 4s. Repeat 4 times.", color: "bg-secondary-container text-on-secondary-container" },
  { id: "bodyscan", title: "Body Scan Meditation", duration: "10 min", icon: "self_improvement", description: "Slowly move awareness through each part of your body, releasing tension.", color: "bg-primary-container text-on-primary-container" },
  { id: "mindfulwalk", title: "Mindful Walk", duration: "15 min", icon: "directions_walk", description: "Take a slow walk, noticing 3 things you see, hear, and feel with each step.", color: "bg-tertiary-fixed text-on-tertiary-fixed" },
  { id: "journaling", title: "Journaling Prompt", duration: "10 min", icon: "edit_note", description: "Write freely about: What went well today? What am I grateful for?", color: "bg-surface-container-high text-on-surface" },
];

const HOPE_MESSAGES = [
  { text: "You have survived 100% of your hardest days.", bg: "bg-primary-container", gradient: "from-primary to-secondary", textColor: "text-on-primary" },
  { text: "This feeling is temporary, but your strength is permanent.", bg: "bg-secondary-container", gradient: "from-secondary to-primary", textColor: "text-on-secondary-container" },
  { text: "It's okay to not be okay. Healing is not linear.", bg: "bg-surface-container-high", gradient: "from-outline to-surface-variant", textColor: "text-on-surface" },
  { text: "You are more than your current struggle.", bg: "bg-primary", gradient: "from-primary-fixed-dim to-primary", textColor: "text-on-primary" },
  { text: "One step at a time. You don't have to have it all figured out.", bg: "bg-secondary", gradient: "from-secondary-fixed-dim to-secondary", textColor: "text-on-secondary" },
  { text: "Asking for help is a sign of incredible strength.", bg: "bg-tertiary-fixed", gradient: "from-tertiary-fixed-dim to-tertiary-fixed", textColor: "text-on-tertiary-fixed" },
];

export default function WellnessPage() {
  const [activeSection, setActiveSection] = useState<"exercises" | "resources" | "milestones" | "hope">("exercises");
  const [userId, setUserId] = useState<string | null>(null);
  const [completedActivities, setCompletedActivities] = useState<string[]>([]);
  const [activities, setActivities] = useState<WellnessActivity[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    insforge.auth.getCurrentUser().then(({ data }) => {
      if (data?.user) {
        setUserId(data.user.id);
        // Load completed activities
        insforge.database.from("wellness_activities")
          .select()
          .eq("user_id", data.user.id)
          .eq("completed", true)
          .then(({ data: acts }) => {
            if (acts) {
              setActivities(acts as WellnessActivity[]);
              setCompletedActivities(acts.map((a: WellnessActivity) => a.activity_type));
            }
          });
      }
    });
  }, []);

  const completeExercise = async (exerciseId: string, name: string, duration: number) => {
    if (!userId || saving) return;
    setSaving(exerciseId);

    if (completedActivities.includes(exerciseId)) {
      // Undo
      const existing = activities.find(a => a.activity_type === exerciseId);
      if (existing) {
        await insforge.database.from("wellness_activities").delete().eq("id", existing.id);
        setCompletedActivities(prev => prev.filter(e => e !== exerciseId));
        setActivities(prev => prev.filter(a => a.activity_type !== exerciseId));
      }
    } else {
      // Mark complete
      const { data } = await insforge.database.from("wellness_activities").insert([{
        user_id: userId,
        activity_type: exerciseId,
        activity_name: name,
        duration_minutes: duration,
        completed: true,
        notes: `Completed ${name}`,
      }]).select();

      if (data?.[0]) {
        setCompletedActivities(prev => [...prev, exerciseId]);
        setActivities(prev => [...prev, data[0] as WellnessActivity]);
        setSavedMsg(`✓ "${name}" recorded!`);
        setTimeout(() => setSavedMsg(""), 3000);
      }
    }
    setSaving(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar variant="student" />
      <main className="flex-1 pt-16">
        {/* Hero */}
        <div className="bg-gradient-to-br from-secondary-container/30 to-primary-container/20 px-6 md:px-20 py-16 text-center border-b border-outline-variant/30">
          <div className="max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-container text-sm font-semibold rounded-full mb-4">
              <span className="material-symbols-outlined text-[16px]">self_improvement</span>
              Your Wellness Journey
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-on-surface mb-3">Your Wellness Hub</h1>
            <p className="text-on-surface-variant leading-relaxed">Tools, exercises, and resources to support your mental wellbeing — at your own pace.</p>
          </div>
        </div>

        <div className="px-4 md:px-20 py-10 max-w-6xl mx-auto">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 bg-surface-container-low rounded-xl p-1.5 w-fit">
            {(["exercises", "resources", "milestones", "hope"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveSection(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${activeSection === tab ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>
                {tab === "hope" ? "Hope Gallery" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {savedMsg && (
            <div className="mb-4 bg-secondary-container text-on-secondary-container px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in">
              <span className="material-symbols-outlined icon-fill text-[18px]">check_circle</span>
              {savedMsg}
            </div>
          )}

          {/* Exercises */}
          {activeSection === "exercises" && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-on-surface mb-6">Wellness Exercises</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {EXERCISES.map(ex => {
                  const done = completedActivities.includes(ex.id);
                  return (
                    <div key={ex.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ex.color}`}>
                          <span className="material-symbols-outlined icon-fill text-[22px]">{ex.icon}</span>
                        </div>
                        <span className="text-xs bg-surface-container text-on-surface-variant px-3 py-1 rounded-full">{ex.duration}</span>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-on-surface mb-1">{ex.title}</h3>
                        <p className="text-sm text-on-surface-variant leading-relaxed">{ex.description}</p>
                      </div>
                      <button onClick={() => completeExercise(ex.id, ex.title, parseInt(ex.duration))} disabled={saving === ex.id}
                        className={`mt-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${done ? "bg-secondary-container text-on-secondary-container" : "bg-primary text-on-primary hover:opacity-90"}`}>
                        <span className="material-symbols-outlined text-[18px]">
                          {saving === ex.id ? "hourglass_empty" : done ? "check_circle" : "play_circle"}
                        </span>
                        {saving === ex.id ? "Saving…" : done ? "Completed ✓" : "Start Exercise"}
                      </button>
                    </div>
                  );
                })}
              </div>

              {completedActivities.length > 0 && (
                <div className="mt-6 p-4 bg-secondary-container/30 border border-secondary-fixed-dim rounded-xl flex items-center gap-3 animate-fade-in">
                  <span className="material-symbols-outlined icon-fill text-secondary text-[28px]">emoji_events</span>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">
                      {completedActivities.length} exercise{completedActivities.length > 1 ? "s" : ""} completed today!
                    </p>
                    <p className="text-xs text-on-surface-variant">Your progress is saved to your wellness record.</p>
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
                {RESOURCES.map(cat => (
                  <div key={cat.category} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.color}`}>
                        <span className="material-symbols-outlined icon-fill text-[22px]">{cat.icon}</span>
                      </div>
                      <h3 className="text-base font-semibold text-on-surface">{cat.category}</h3>
                    </div>
                    <div className="space-y-2">
                      {cat.items.map(item => (
                        <button key={item} className="w-full text-left flex items-center gap-2 px-3 py-2.5 bg-surface-bright border border-surface-container-high rounded-lg hover:bg-surface-container transition-colors group">
                          <span className="material-symbols-outlined text-secondary text-[16px] shrink-0">article</span>
                          <span className="text-sm text-on-surface flex-1">{item}</span>
                          <span className="material-symbols-outlined text-on-surface-variant text-[16px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">arrow_forward</span>
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
              <p className="text-on-surface-variant text-sm mb-6">Your real activity history from the database.</p>
              {activities.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[50px] block mb-3 opacity-20">emoji_events</span>
                  <p className="text-sm">Complete exercises to earn milestones.</p>
                  <button onClick={() => setActiveSection("exercises")} className="mt-3 text-primary text-sm font-semibold hover:underline">
                    Start an exercise →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activities.map(a => (
                    <div key={a.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex items-start gap-3 shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined icon-fill text-[20px]">check_circle</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{a.activity_name || a.activity_type}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {a.duration_minutes ? `${a.duration_minutes} min · ` : ""}
                          {new Date(a.created_at).toLocaleDateString()}
                        </p>
                        <span className="text-xs text-secondary font-medium flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined icon-fill text-[14px]">check_circle</span>Completed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Hope Gallery */}
          {activeSection === "hope" && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-on-surface mb-2">Messages of Hope</h2>
              <p className="text-on-surface-variant text-sm mb-6">Reminders that you are valued and resilient.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {HOPE_MESSAGES.map((msg, i) => (
                  <div key={i} className={`relative overflow-hidden rounded-xl aspect-video flex items-center justify-center p-6 text-center ${msg.bg}`}>
                    <div className={`absolute inset-0 opacity-40 bg-gradient-to-br ${msg.gradient}`} />
                    <p className={`relative z-10 text-sm font-semibold leading-relaxed ${msg.textColor}`}>"{msg.text}"</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-6 bg-primary-container/20 border border-outline-variant/50 rounded-2xl text-center">
                <span className="material-symbols-outlined icon-fill text-primary text-[40px] mb-3 block">favorite</span>
                <h3 className="text-lg font-bold text-on-surface mb-2">You matter. You belong here.</h3>
                <p className="text-on-surface-variant text-sm max-w-md mx-auto mb-4">Every step you take towards your wellbeing is an act of courage.</p>
                <Link href="/crisis" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90">
                  <span className="material-symbols-outlined icon-fill text-[18px]">emergency</span>Get Immediate Help
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
