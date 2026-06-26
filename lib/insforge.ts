import { createClient } from "@insforge/sdk";

// ─── Singleton browser client ─────────────────────────────────────────────────
// Uses httpOnly cookies for auth automatically — no configuration needed for
// standard browser sessions. All pages import this single instance.

export const insforge = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
});

// ─── Types matching the DB schema ─────────────────────────────────────────────

export type RiskLevel = "Critical" | "High" | "Moderate" | "Minimal";
export type MoodScore = 1 | 2 | 3 | 4 | 5;

export interface StudentProfile {
  id: string;
  name: string | null;
  email: string | null;
  role: "student" | "counsellor";
  faculty: string | null;
  year_of_study: number | null;
  anonymous_id: string | null;
  language_preference: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MoodEntry {
  id: string;
  user_id: string;
  mood_score: number;
  stress_level: number | null;
  emoji: string | null;
  notes: string | null;
  created_at: string;
}

export interface ScreeningResult {
  id: string;
  user_id: string;
  score: number;
  severity: string;
  risk_level: string | null;
  responses: Record<string, number>;
  flagged_keywords: string[] | null;
  created_at: string;
}

export interface CounsellorSession {
  id: string;
  student_id: string;
  counsellor_id: string;
  status: string;
  risk_level: string | null;
  phq9_score: number | null;
  ai_summary: string | null;
  notes: string | null;
  intervention_logged: boolean;
  student_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  sender_id: string;
  sender_role: "student" | "counsellor" | "system";
  content: string;
  is_flagged: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export interface Referral {
  id: string;
  student_id: string;
  counsellor_id: string;
  session_id: string | null;
  referral_type: string;
  destination: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WellnessActivity {
  id: string;
  user_id: string;
  activity_type: string;
  activity_name: string | null;
  duration_minutes: number | null;
  completed: boolean;
  notes: string | null;
  created_at: string;
}

export interface CrisisSafetyPlan {
  id: string;
  user_id: string;
  warning_signs: string[];
  coping_strategies: string[];
  support_contacts: Array<{ name: string; phone: string }>;
  professional_contacts: Array<{ name: string; phone: string }>;
  created_at: string;
  updated_at: string;
}

// ─── PHQ-9 helpers ────────────────────────────────────────────────────────────

export function getSeverity(score: number): {
  label: string;
  risk: RiskLevel;
  color: string;
} {
  if (score <= 4)
    return { label: "Minimal", risk: "Minimal", color: "text-secondary" };
  if (score <= 9)
    return { label: "Mild", risk: "Minimal", color: "text-on-surface" };
  if (score <= 14)
    return { label: "Moderate", risk: "Moderate", color: "text-primary" };
  if (score <= 19)
    return { label: "Moderately Severe", risk: "High", color: "text-error" };
  return { label: "Severe", risk: "Critical", color: "text-error" };
}

// ─── Crisis keyword detection ─────────────────────────────────────────────────

const CRISIS_KEYWORDS = [
  "hopeless", "worthless", "giving up", "end it", "suicide", "self-harm",
  "hurt myself", "no point", "pointless", "want to die", "kill myself",
  "can't go on", "can't take it", "rather be dead", "ending my life",
];

export function detectKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.filter((kw) => lower.includes(kw));
}

// ─── XAI: Generate a human-readable risk interpretation from PHQ-9 answers ───

const PHQ9_LABELS = [
  "Little interest or pleasure",
  "Feeling down or hopeless",
  "Sleep problems",
  "Low energy or fatigue",
  "Appetite changes",
  "Feeling like a failure",
  "Trouble concentrating",
  "Psychomotor changes",
  "Thoughts of self-harm",
];

const OPTION_LABELS = ["Not at all", "Several days", "More than half the days", "Nearly every day"];

export interface XAIMarker {
  question: string;
  answer: string;
  score: number;
  severity: "low" | "moderate" | "high" | "critical";
  flag: boolean;
}

export interface XAIResult {
  summary: string;
  confidence: number;
  markers: XAIMarker[];
  flaggedQuestions: number[];
  dominantSymptoms: string[];
}

export function generateXAI(responses: Record<string, number>, totalScore: number): XAIResult {
  const markers: XAIMarker[] = [];
  const flaggedQuestions: number[] = [];
  const dominantSymptoms: string[] = [];

  for (let i = 1; i <= 9; i++) {
    const val = responses[`q${i}`] ?? 0;
    const label = PHQ9_LABELS[i - 1];
    const answerLabel = OPTION_LABELS[val] ?? "Not at all";
    const sev: XAIMarker["severity"] =
      val === 0 ? "low" : val === 1 ? "moderate" : val === 2 ? "high" : "critical";

    // Q9 (self-harm) is always flagged if > 0
    const flag = (i === 9 && val > 0) || val >= 3;
    if (flag) flaggedQuestions.push(i);
    if (val >= 2) dominantSymptoms.push(label.toLowerCase());

    markers.push({ question: label, answer: answerLabel, score: val, severity: sev, flag });
  }

  const sev = getSeverity(totalScore);
  const hasQ9 = (responses["q9"] ?? 0) > 0;

  let summary = `Score of ${totalScore} indicates ${sev.label} depression (${sev.risk} risk).`;
  if (hasQ9) summary += " ⚠️ Question 9 (thoughts of self-harm) was endorsed — immediate follow-up required.";
  if (dominantSymptoms.length > 0)
    summary += ` Dominant symptoms: ${dominantSymptoms.slice(0, 3).join(", ")}.`;

  // Confidence: based on number of high/critical items vs total
  const highItems = markers.filter((m) => m.score >= 2).length;
  const confidence = Math.min(95, 60 + highItems * 5);

  return { summary, confidence, markers, flaggedQuestions, dominantSymptoms };
}

// ─── Relapse / Trend model ────────────────────────────────────────────────────

export type TrendDirection = "improving" | "stable" | "worsening" | "critical_spike";

export interface TrendResult {
  direction: TrendDirection;
  label: string;
  color: string;
  icon: string;
  delta: number;
  description: string;
}

export function computeTrend(scores: number[]): TrendResult {
  if (scores.length < 2) {
    return {
      direction: "stable",
      label: "Stable",
      color: "text-on-surface",
      icon: "trending_flat",
      delta: 0,
      description: "Not enough data to determine a trend yet.",
    };
  }

  // Use last 3 scores (most recent first)
  const recent = scores.slice(0, Math.min(3, scores.length));
  const latest = recent[0];
  const previous = recent[recent.length - 1];
  const delta = latest - previous;

  // Critical spike: jumped into severe range
  if (latest >= 15 && previous < 10) {
    return {
      direction: "critical_spike",
      label: "Critical Spike",
      color: "text-error",
      icon: "trending_up",
      delta,
      description: `Score jumped from ${previous} to ${latest}. Immediate counsellor review recommended.`,
    };
  }

  if (delta <= -3) {
    return {
      direction: "improving",
      label: "Improving",
      color: "text-secondary",
      icon: "trending_down",
      delta,
      description: `Score decreased by ${Math.abs(delta)} points since last check-in. Keep it up.`,
    };
  }

  if (delta >= 3) {
    return {
      direction: "worsening",
      label: "Worsening",
      color: "text-error",
      icon: "trending_up",
      delta,
      description: `Score increased by ${delta} points. Consider scheduling a counsellor session.`,
    };
  }

  return {
    direction: "stable",
    label: "Stable",
    color: "text-primary",
    icon: "trending_flat",
    delta,
    description: `Score has remained relatively stable (±${Math.abs(delta)} points).`,
  };
}

// ─── Risk colour map ──────────────────────────────────────────────────────────

export const riskColors: Record<
  RiskLevel,
  { border: string; badge: string; text: string }
> = {
  Critical: {
    border: "border-l-error",
    badge: "bg-error-container text-on-error-container",
    text: "text-error",
  },
  High: {
    border: "border-l-secondary-container",
    badge: "bg-secondary-container text-on-secondary-container",
    text: "text-secondary",
  },
  Moderate: {
    border: "border-l-surface-container-highest",
    badge: "bg-surface-container-highest text-on-surface",
    text: "text-on-surface",
  },
  Minimal: {
    border: "border-l-outline-variant",
    badge:
      "bg-surface-container-low border border-outline-variant text-on-surface-variant",
    text: "text-on-surface-variant",
  },
};
