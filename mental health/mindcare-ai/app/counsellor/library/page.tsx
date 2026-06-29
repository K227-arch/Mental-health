"use client";

import { useState } from "react";
import clsx from "clsx";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  type: "article" | "exercise" | "video" | "guide";
}

const categories = ["All", "Depression", "Anxiety", "Sleep", "Resilience", "Stress"];

const resources: Resource[] = [
  {
    id: "1",
    title: "Understanding Depression: Signs and Coping Strategies",
    description: "Learn to identify early warning signs of depression and explore evidence-based coping techniques including CBT and mindfulness.",
    category: "Depression",
    readTime: "8 min read",
    type: "article",
  },
  {
    id: "2",
    title: "Grounding Exercises for Anxiety Relief",
    description: "A step-by-step guide to the 5-4-3-2-1 grounding technique and other sensory exercises to manage acute anxiety.",
    category: "Anxiety",
    readTime: "5 min read",
    type: "exercise",
  },
  {
    id: "3",
    title: "Sleep Hygiene: A Comprehensive Guide",
    description: "Practical tips for improving sleep quality, including routine building, environment optimization, and relaxation techniques.",
    category: "Sleep",
    readTime: "10 min read",
    type: "guide",
  },
  {
    id: "4",
    title: "Building Emotional Resilience in Students",
    description: "Discover how to foster psychological resilience through cognitive reframing, social support networks, and self-compassion practices.",
    category: "Resilience",
    readTime: "12 min read",
    type: "article",
  },
  {
    id: "5",
    title: "Stress Management for Exam Periods",
    description: "Targeted strategies to help students cope with academic pressure, including time management and relaxation protocols.",
    category: "Stress",
    readTime: "7 min read",
    type: "guide",
  },
  {
    id: "6",
    title: "Cognitive Behavioral Therapy Fundamentals",
    description: "An overview of CBT principles and how they can be applied to challenge negative thought patterns and behaviors.",
    category: "Depression",
    readTime: "15 min read",
    type: "article",
  },
  {
    id: "7",
    title: "Progressive Muscle Relaxation Audio",
    description: "A guided audio exercise for progressive muscle relaxation, ideal for reducing physical tension and promoting calm.",
    category: "Anxiety",
    readTime: "10 min session",
    type: "video",
  },
  {
    id: "8",
    title: "Mindfulness Meditation for Better Sleep",
    description: "A guided meditation designed to quiet the mind and prepare the body for restful, restorative sleep.",
    category: "Sleep",
    readTime: "15 min session",
    type: "exercise",
  },
  {
    id: "9",
    title: "Gratitude Journaling: A Resilience Tool",
    description: "Explore the science-backed benefits of gratitude journaling and how it builds long-term emotional resilience.",
    category: "Resilience",
    readTime: "6 min read",
    type: "exercise",
  },
];

const categoryColors: Record<string, string> = {
  Depression: "bg-error-container text-on-error-container",
  Anxiety: "bg-secondary-container text-on-secondary-container",
  Sleep: "bg-primary-fixed text-on-primary-fixed-variant",
  Resilience: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  Stress: "bg-surface-container-highest text-on-surface",
};

const typeIcons: Record<string, string> = {
  article: "article",
  exercise: "fitness_center",
  video: "play_circle",
  guide: "menu_book",
};

export default function CounsellorLibrary() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = resources.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || r.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-on-background">Wellness Resource Library</h1>
        <p className="text-on-surface-variant mt-1">Curated resources to support student mental health and wellbeing.</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources..."
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-11 pr-4 py-3 text-sm text-on-background outline-none focus:ring-2 focus:ring-primary placeholder:text-on-surface-variant/60"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={clsx(
                "px-4 py-1.5 rounded-full text-xs font-medium transition-colors border",
                activeCategory === cat
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-primary hover:text-primary"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] mb-3">search_off</span>
          <p className="text-sm font-medium">No resources found</p>
          <p className="text-xs mt-1">Try adjusting your search or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((resource) => (
            <div
              key={resource.id}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={clsx("text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold", categoryColors[resource.category])}>
                  {resource.category}
                </span>
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant/60">{typeIcons[resource.type]}</span>
              </div>
              <h3 className="text-sm font-bold text-on-background mb-2 leading-snug">{resource.title}</h3>
              <p className="text-xs text-on-surface-variant mb-4 flex-1 leading-relaxed">{resource.description}</p>
              <div className="flex items-center justify-between pt-3 border-t border-outline-variant">
                <span className="text-[10px] text-outline flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">schedule</span>
                  {resource.readTime}
                </span>
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(resource.title + " mental health")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Open Resource
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
