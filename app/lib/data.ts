// ΓöÇΓöÇΓöÇ Types ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export type RiskLevel = "Critical" | "High" | "Moderate" | "Minimal";

export interface Student {
  id: string;
  anonymousId: string;
  faculty: string;
  year: number;
  riskLevel: RiskLevel;
  trend: "Declining" | "Stable" | "Improving";
  lastActive: string;
  phq9Score: number;
  moodLabel: string;
  depressionIndex: string;
  summary: string;
  flaggedSnippet?: string;
  flaggedTime?: string;
  hasNewMessage?: boolean;
}

export interface WellnessMilestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  color: string;
}

export interface HopeMessage {
  id: string;
  text: string;
  colorClass: string;
  gradientClass: string;
  textClass: string;
}

export interface ScreeningQuestion {
  id: number;
  text: string;
  options: string[];
}

export interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
  timestamp: string;
}

export interface MoodDataPoint {
  day: string;
  stress: number;
  intervention: number;
}

export interface StatCard {
  label: string;
  value: string;
  icon: string;
  trend: string;
  trendColor: string;
  trendIcon: string;
}

// ΓöÇΓöÇΓöÇ Mock Data ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export const students: Student[] = [
  {
    id: "1",
    anonymousId: "Student #8942",
    faculty: "Engineering",
    year: 2,
    riskLevel: "Critical",
    trend: "Declining",
    lastActive: "10 minutes ago",
    phq9Score: 18,
    moodLabel: "Severe",
    depressionIndex: "High",
    summary:
      "Frequent mentions of hopelessness in latest chat logs. PHQ-9 indicates severe depression.",
    flaggedSnippet:
      "I just don't see the point in trying for these midterms anymore. Everything feels too heavy to carry.",
    flaggedTime: "Yesterday, 03:15 AM",
    hasNewMessage: true,
  },
  {
    id: "2",
    anonymousId: "Student #4120",
    faculty: "Arts",
    year: 1,
    riskLevel: "High",
    trend: "Stable",
    lastActive: "2 hours ago",
    phq9Score: 13,
    moodLabel: "Moderate",
    depressionIndex: "Moderate",
    summary:
      "Elevated anxiety markers reported. Missed two scheduled check-ins.",
    flaggedSnippet: "I've been struggling to get out of bed. Everything feels pointless lately.",
    flaggedTime: "2 days ago, 11:45 PM",
  },
  {
    id: "3",
    anonymousId: "Student #7731",
    faculty: "Business",
    year: 3,
    riskLevel: "Moderate",
    trend: "Improving",
    lastActive: "Yesterday",
    phq9Score: 8,
    moodLabel: "Mild",
    depressionIndex: "Low",
    summary:
      "Academic stress increasing. Requesting strategies for focus.",
    flaggedSnippet: "Exams are coming up and I'm feeling overwhelmed by all the pressure.",
    flaggedTime: "3 days ago, 09:20 AM",
  },
  {
    id: "4",
    anonymousId: "Student #2219",
    faculty: "Medicine",
    year: 4,
    riskLevel: "Minimal",
    trend: "Stable",
    lastActive: "2 days ago",
    phq9Score: 3,
    moodLabel: "Good",
    depressionIndex: "Minimal",
    summary: "Routine weekly check-in completed. Mood stable.",
  },
];

export const phq9Questions: ScreeningQuestion[] = [
  {
    id: 1,
    text: "Little interest or pleasure in doing things?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
  },
  {
    id: 2,
    text: "Feeling down, depressed, or hopeless?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
  },
  {
    id: 3,
    text: "Trouble falling or staying asleep, or sleeping too much?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
  },
  {
    id: 4,
    text: "Feeling tired or having little energy?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
  },
  {
    id: 5,
    text: "Poor appetite or overeating?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
  },
  {
    id: 6,
    text: "Feeling bad about yourself ΓÇö or that you are a failure or have let yourself or your family down?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
  },
  {
    id: 7,
    text: "Trouble concentrating on things, such as reading the newspaper or watching television?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
  },
  {
    id: 8,
    text: "Moving or speaking so slowly that other people could have noticed? Or so fidgety or restless that you have been moving a lot more than usual?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
  },
  {
    id: 9,
    text: "Thoughts that you would be better off dead, or thoughts of hurting yourself in some way?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
  },
];

export const hopeMessages: HopeMessage[] = [
  {
    id: "1",
    text: "You have survived 100% of your hardest days.",
    colorClass: "bg-primary-container",
    gradientClass: "from-primary to-secondary",
    textClass: "text-on-primary",
  },
  {
    id: "2",
    text: "This feeling is temporary, but your strength is permanent.",
    colorClass: "bg-secondary-container",
    gradientClass: "from-secondary to-primary",
    textClass: "text-on-secondary-container",
  },
  {
    id: "3",
    text: "It's okay to not be okay. Healing is not linear.",
    colorClass: "bg-surface-container-high",
    gradientClass: "from-outline to-surface-variant",
    textClass: "text-on-surface",
  },
  {
    id: "4",
    text: "You are more than your current struggle.",
    colorClass: "bg-primary",
    gradientClass: "from-primary-fixed-dim to-primary",
    textClass: "text-on-primary",
  },
  {
    id: "5",
    text: "One step at a time. You don't have to have it all figured out.",
    colorClass: "bg-secondary",
    gradientClass: "from-secondary-fixed-dim to-secondary",
    textClass: "text-on-secondary",
  },
  {
    id: "6",
    text: "Asking for help is a sign of incredible strength.",
    colorClass: "bg-tertiary-fixed",
    gradientClass: "from-tertiary-fixed-dim to-tertiary-fixed",
    textClass: "text-on-tertiary-fixed",
  },
];

export const wellnessMilestones: WellnessMilestone[] = [
  {
    id: "1",
    title: "Mindfulness Novice",
    description: "Completed 5 sessions",
    icon: "self_improvement",
    earned: true,
    color: "bg-secondary-container text-on-secondary-container",
  },
  {
    id: "2",
    title: "Restful Routine",
    description: "7 days consistent sleep",
    icon: "hotel",
    earned: true,
    color: "bg-primary-container text-on-primary-container",
  },
  {
    id: "3",
    title: "Resilience Builder",
    description: "Complete CBT module",
    icon: "lock",
    earned: false,
    color: "bg-surface-variant text-on-surface-variant",
  },
  {
    id: "4",
    title: "Check-in Champion",
    description: "14-day streak",
    icon: "lock",
    earned: false,
    color: "bg-surface-variant text-on-surface-variant",
  },
];

export const moodChartData: MoodDataPoint[] = [
  { day: "D1", stress: 30, intervention: 0 },
  { day: "D3", stress: 45, intervention: 0 },
  { day: "D5", stress: 60, intervention: 20 },
  { day: "D7", stress: 75, intervention: 60 },
  { day: "D9", stress: 50, intervention: 40 },
  { day: "D11", stress: 40, intervention: 30 },
  { day: "D13", stress: 25, intervention: 80 },
  { day: "D15", stress: 20, intervention: 80 },
  { day: "D17", stress: 35, intervention: 40 },
  { day: "D19", stress: 45, intervention: 30 },
  { day: "D21", stress: 30, intervention: 60 },
  { day: "D23", stress: 25, intervention: 80 },
  { day: "D25", stress: 20, intervention: 75 },
  { day: "D27", stress: 15, intervention: 70 },
  { day: "D30", stress: 18, intervention: 65 },
];

export const counsellorStats: StatCard[] = [
  {
    label: "Active Critical Alerts",
    value: "3",
    icon: "warning",
    trend: "+1 since yesterday",
    trendColor: "text-error",
    trendIcon: "trending_up",
  },
  {
    label: "Pending Interventions",
    value: "12",
    icon: "pending_actions",
    trend: "Requires review today",
    trendColor: "text-on-surface-variant",
    trendIcon: "schedule",
  },
  {
    label: "Referral Success",
    value: "84%",
    icon: "check_circle",
    trend: "+2% this week",
    trendColor: "text-secondary",
    trendIcon: "trending_up",
  },
  {
    label: "Avg Response Time",
    value: "14m",
    icon: "timer",
    trend: "-2m this week",
    trendColor: "text-secondary",
    trendIcon: "trending_down",
  },
];

export const supportedLanguages = [
  { code: "en", label: "English" },
  { code: "rny", label: "Runyankore" },
  { code: "lg", label: "Luganda" },
  { code: "sw", label: "Swahili" },
];

export function getPHQ9Severity(score: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (score <= 4) return { label: "Minimal", color: "text-secondary", bg: "bg-secondary-container" };
  if (score <= 9) return { label: "Mild", color: "text-on-surface", bg: "bg-surface-container-high" };
  if (score <= 14) return { label: "Moderate", color: "text-primary", bg: "bg-primary-fixed" };
  if (score <= 19) return { label: "Moderately Severe", color: "text-error", bg: "bg-error-container" };
  return { label: "Severe", color: "text-on-error", bg: "bg-error" };
}

export const riskColors: Record<RiskLevel, { border: string; badge: string; text: string }> = {
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
    badge: "bg-surface-container-low border border-outline-variant text-on-surface-variant",
    text: "text-on-surface-variant",
  },
};