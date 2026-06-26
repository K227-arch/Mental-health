"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import { insforge } from "@/lib/insforge";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  type: "article" | "exercise" | "video" | "guide";
}

const CATEGORIES = ["All", "Depression", "Anxiety", "Sleep", "Resilience", "Stress", "Crisis"];

const RESOURCES: Resource[] = [
  { id: "1", title: "Understanding Depression: Signs and Coping Strategies", description: "Learn to identify early warning signs of depression and evidence-based coping techniques including CBT and mindfulness.", category: "Depression", readTime: "8 min", type: "article" },
  { id: "2", title: "Grounding Exercises for Anxiety Relief", description: "Step-by-step guide to the 5-4-3-2-1 grounding technique and other sensory exercises to manage acute anxiety.", category: "Anxiety", readTime: "5 min", type: "exercise" },
  { id: "3", title: "Sleep Hygiene: A Comprehensive Guide", description: "Practical tips for improving sleep quality — routine building, environment optimisation, and relaxation techniques.", category: "Sleep", readTime: "10 min", type: "guide" },
  { id: "4", title: "Building Emotional Resilience in Students", description: "Psychological resilience through cognitive reframing, social support networks, and self-compassion practices.", category: "Resilience", readTime: "12 min", type: "article" },
  { id: "5", title: "Stress Management for Exam Periods", description: "Targeted strategies for academic pressure: time management, relaxation protocols, and cognitive reframing.", category: "Stress", readTime: "7 min", type: "guide" },
  { id: "6", title: "Cognitive Behavioral Therapy Fundamentals", description: "An overview of CBT principles and how they challenge negative thought patterns and behavioural avoidance.", category: "Depression", readTime: "15 min", type: "article" },
  { id: "7", title: "Progressive Muscle Relaxation", description: "A guided exercise for progressive muscle relaxation — reduces physical tension and promotes calm after stress.", category: "Anxiety", readTime: "10 min", type: "video" },
  { id: "8", title: "Mindfulness Meditation for Better Sleep", description: "Guided meditation designed to quieten the mind and prepare the body for restful, restorative sleep.", category: "Sleep", readTime: "15 min", type: "exercise" },
  { id: "9", title: "Gratitude Journaling: A Resilience Tool", description: "Science-backed benefits of gratitude journaling and how it builds long-term emotional resilience.", category: "Resilience", readTime: "6 min", type: "exercise" },
  { id: "10", title: "Crisis Intervention: First Response Guide", description: "Step-by-step counsellor guide for handling acute mental health crises — assessment, de-escalation, referral.", category: "Crisis", readTime: "20 min", type: "guide" },
  { id: "11", title: "Suicide Risk Assessment (Columbia Protocol)", description: "Evidence-based framework for assessing and stratifying suicide risk in university students.", category: "Crisis", readTime: "25 min", type: "guide" },
  { id: "12", title: "Motivational Interviewing for Students", description: "Techniques to engage ambivalent students in the counselling process and build intrinsic motivation for change.", category: "Resilience", readTime: "18 min", type: "article" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Depression: "bg-error-container text-on-error-container",
  Anxiety: "bg-secondary-container text-on-secondary-container",
  Sleep: "bg-primary-fixed text-on-primary-fixed-variant",
  Resilience: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  Stress: "bg-surface-container-highest text-on-surface",
  Crisis: "bg-error text-on-error",
};

const TYPE_ICONS: Record<string, string> = {
  article: "article",
  exercise: "fitness_center",
  video: "play_circle",
  guide: "menu_book",
};

export default function CounsellorLibrary() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [activeSessions, setActiveSessions] = useState<Array<{ id: string; student_id: string; student_name: string }>>([]);
  const [sendSuccess, setSendSuccess] = useState("");

  useEffect(() => {
    // Load active sessions for "send to student" feature
    insforge.database.from("counsellor_sessions")
      .select("id, student_id, student_name")
      .eq("status", "active")
      .then(({ data }) => { if (data) setActiveSessions(data as any); });
  }, []);

  const sendResourceToStudent = async (resource: Resource, sessionId: string, studentId: string) => {
    setSendingTo(resource.id);
    // Send as a system message in the chat
    await insforge.database.from("messages").insert([{
      session_id: sessionId,
      sender_id: "counsellor",
      sender_role: "counsellor",
      content: `📚 Resource shared by your counsellor:\n\n**${resource.title}**\n${resource.description}\n\n${resource.readTime} · ${resource.type}`,
      is_flagged: false,
    }]);

    // Notify student
    await insforge.database.from("notifications").insert([{
      user_id: studentId,
      title: "Your counsellor shared a resource",
      body: resource.title,
      type: "info",
      link: "/messages",
    }]);

    setSendSuccess(`"${resource.title}" sent to student.`);
    setSendingTo(null);
    setTimeout(() => setSendSuccess(""), 4000);
  };

  const toggleSave = (id: string) => {
    setSavedIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const filtered = RESOURCES.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || r.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-background">Wellness Resource Library</h1>
          <p className="text-on-surface-variant mt-1">Curated clinical resources — share directly with students.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-full">
            {RESOURCES.length} resources
          </span>
          {savedIds.length > 0 && (
            <span className="text-xs bg-primary-container text-on-primary-container px-3 py-1.5 rounded-full font-medium">
              {savedIds.length} saved
            </span>
          )}
        </div>
      </div>

      {/* Success banner */}
      {sendSuccess && (
        <div className="bg-secondary-container text-on-secondary-container px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined icon-fill text-[18px]">check_circle</span>
          {sendSuccess}
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search resources…"
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-11 pr-4 py-3 text-sm text-on-background outline-none focus:ring-2 focus:ring-primary" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={clsx(
                "px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border",
                activeCategory === cat
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-primary hover:text-primary"
              )}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] mb-3 opacity-30">search_off</span>
          <p className="text-sm font-medium">No resources found</p>
          <p className="text-xs mt-1 opacity-70">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(resource => (
            <div key={resource.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col group">
              {/* Category + type */}
              <div className="flex items-start justify-between mb-3">
                <span className={clsx("text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold shrink-0", CATEGORY_COLORS[resource.category] || "bg-surface-container text-on-surface")}>
                  {resource.category}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleSave(resource.id)}
                    className={`p-1 rounded-full transition-colors ${savedIds.includes(resource.id) ? "text-primary" : "text-on-surface-variant/40 hover:text-on-surface-variant"}`}
                    title={savedIds.includes(resource.id) ? "Unsave" : "Save"}>
                    <span className="material-symbols-outlined text-[18px]" style={savedIds.includes(resource.id) ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      bookmark
                    </span>
                  </button>
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant/40">{TYPE_ICONS[resource.type]}</span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-on-background mb-2 leading-snug">{resource.title}</h3>
              <p className="text-xs text-on-surface-variant mb-4 flex-1 leading-relaxed">{resource.description}</p>

              {/* Footer */}
              <div className="pt-3 border-t border-outline-variant space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-outline flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                    {resource.readTime}
                  </span>
                  <button className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                    Open
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </button>
                </div>

                {/* Send to student dropdown */}
                {activeSessions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select
                      className="flex-1 text-xs bg-surface-container border border-outline-variant rounded-lg px-2 py-1.5 text-on-surface outline-none focus:ring-1 focus:ring-primary"
                      defaultValue=""
                      onChange={async e => {
                        if (!e.target.value) return;
                        const [sessId, studId] = e.target.value.split("|");
                        await sendResourceToStudent(resource, sessId, studId);
                        e.target.value = "";
                      }}
                      disabled={sendingTo === resource.id}
                    >
                      <option value="">Send to student…</option>
                      {activeSessions.map(s => (
                        <option key={s.id} value={`${s.id}|${s.student_id}`}>
                          {s.student_name || s.student_id}
                        </option>
                      ))}
                    </select>
                    {sendingTo === resource.id && (
                      <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
