// ─── Types ────────────────────────────────────────────────────────────────────

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
  image?: string;
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

// ─── Mock Data ────────────────────────────────────────────────────────────────

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
    text: "Feeling bad about yourself — or that you are a failure or have let yourself or your family down?",
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

// ─── GAD-7 (Generalized Anxiety Disorder) ─────────────────────────────────────

export const gad7Questions: ScreeningQuestion[] = [
  { id: 1, text: "Feeling nervous, anxious, or on edge?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 2, text: "Not being able to stop or control worrying?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 3, text: "Worrying too much about different things?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 4, text: "Trouble relaxing?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 5, text: "Being so restless that it's hard to sit still?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 6, text: "Becoming easily annoyed or irritable?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 7, text: "Feeling afraid, as if something awful might happen?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
];

export function getGAD7Severity(score: number): { label: string; color: string; bg: string } {
  if (score <= 4) return { label: "Minimal Anxiety", color: "text-secondary", bg: "bg-secondary-container" };
  if (score <= 9) return { label: "Mild Anxiety", color: "text-on-surface", bg: "bg-surface-container-high" };
  if (score <= 14) return { label: "Moderate Anxiety", color: "text-primary", bg: "bg-primary-fixed" };
  return { label: "Severe Anxiety", color: "text-error", bg: "bg-error-container" };
}

// ─── WHO-5 (World Health Organization Well-Being Index) ────────────────────────

export const who5Questions: ScreeningQuestion[] = [
  { id: 1, text: "I have felt cheerful and in good spirits.", options: ["At no time", "Some of the time", "Less than half the time", "More than half the time", "Most of the time", "All of the time"] },
  { id: 2, text: "I have felt calm and relaxed.", options: ["At no time", "Some of the time", "Less than half the time", "More than half the time", "Most of the time", "All of the time"] },
  { id: 3, text: "I have felt active and vigorous.", options: ["At no time", "Some of the time", "Less than half the time", "More than half the time", "Most of the time", "All of the time"] },
  { id: 4, text: "I woke up feeling fresh and rested.", options: ["At no time", "Some of the time", "Less than half the time", "More than half the time", "Most of the time", "All of the time"] },
  { id: 5, text: "My daily life has been filled with things that interest me.", options: ["At no time", "Some of the time", "Less than half the time", "More than half the time", "Most of the time", "All of the time"] },
];

export function getWHO5Severity(score: number): { label: string; color: string; bg: string } {
  // WHO-5 raw score 0-25, multiply by 4 for percentage. Higher = better.
  const pct = score * 4;
  if (pct >= 72) return { label: "High Wellbeing", color: "text-secondary", bg: "bg-secondary-container" };
  if (pct >= 50) return { label: "Moderate Wellbeing", color: "text-on-surface", bg: "bg-surface-container-high" };
  if (pct >= 28) return { label: "Low Wellbeing", color: "text-primary", bg: "bg-primary-fixed" };
  return { label: "Very Low Wellbeing — Screening for depression recommended", color: "text-error", bg: "bg-error-container" };
}

// ─── PC-PTSD-5 (Primary Care PTSD Screen) ──────────────────────────────────────

export const pcptsd5Questions: ScreeningQuestion[] = [
  { id: 1, text: "Had nightmares about a stressful event or thought about it when you did not want to?", options: ["No", "Yes"] },
  { id: 2, text: "Tried hard not to think about a stressful event or went out of your way to avoid situations that reminded you of it?", options: ["No", "Yes"] },
  { id: 3, text: "Been constantly on guard, watchful, or easily startled?", options: ["No", "Yes"] },
  { id: 4, text: "Felt numb or detached from people, activities, or your surroundings?", options: ["No", "Yes"] },
  { id: 5, text: "Felt guilty or unable to stop blaming yourself or others for a stressful event or any problems it may have caused?", options: ["No", "Yes"] },
];

export function getPCPTSD5Severity(score: number): { label: string; color: string; bg: string } {
  // Score 0-5 (each Yes = 1). Cutoff of 3+ suggests probable PTSD.
  if (score <= 1) return { label: "Low Risk", color: "text-secondary", bg: "bg-secondary-container" };
  if (score === 2) return { label: "Some Symptoms", color: "text-on-surface", bg: "bg-surface-container-high" };
  if (score === 3) return { label: "Probable PTSD — Further evaluation recommended", color: "text-primary", bg: "bg-primary-fixed" };
  return { label: "High Probability of PTSD — Professional assessment strongly recommended", color: "text-error", bg: "bg-error-container" };
}

// ─── PSS-10 (Perceived Stress Scale) ───────────────────────────────────────────

export const pss10Questions: ScreeningQuestion[] = [
  { id: 1, text: "How often have you been upset because of something that happened unexpectedly?", options: ["Never", "Almost never", "Sometimes", "Fairly often", "Very often"] },
  { id: 2, text: "How often have you felt that you were unable to control the important things in your life?", options: ["Never", "Almost never", "Sometimes", "Fairly often", "Very often"] },
  { id: 3, text: "How often have you felt nervous and stressed?", options: ["Never", "Almost never", "Sometimes", "Fairly often", "Very often"] },
  { id: 4, text: "How often have you felt confident about your ability to handle your personal problems?", options: ["Very often", "Fairly often", "Sometimes", "Almost never", "Never"] },
  { id: 5, text: "How often have you felt that things were going your way?", options: ["Very often", "Fairly often", "Sometimes", "Almost never", "Never"] },
  { id: 6, text: "How often have you found that you could not cope with all the things that you had to do?", options: ["Never", "Almost never", "Sometimes", "Fairly often", "Very often"] },
  { id: 7, text: "How often have you been able to control irritations in your life?", options: ["Very often", "Fairly often", "Sometimes", "Almost never", "Never"] },
  { id: 8, text: "How often have you felt that you were on top of things?", options: ["Very often", "Fairly often", "Sometimes", "Almost never", "Never"] },
  { id: 9, text: "How often have you been angered because of things that happened that were outside of your control?", options: ["Never", "Almost never", "Sometimes", "Fairly often", "Very often"] },
  { id: 10, text: "How often have you felt difficulties were piling up so high that you could not overcome them?", options: ["Never", "Almost never", "Sometimes", "Fairly often", "Very often"] },
];

export function getPSS10Severity(score: number): { label: string; color: string; bg: string } {
  // Score 0-40. 
  if (score <= 13) return { label: "Low Stress", color: "text-secondary", bg: "bg-secondary-container" };
  if (score <= 26) return { label: "Moderate Stress", color: "text-on-surface", bg: "bg-surface-container-high" };
  return { label: "High Perceived Stress", color: "text-error", bg: "bg-error-container" };
}

// ─── Assessment Model Metadata ─────────────────────────────────────────────────

export interface AssessmentModel {
  id: string;
  name: string;
  shortName: string;
  description: string;
  questions: ScreeningQuestion[];
  getSeverity: (score: number) => { label: string; color: string; bg: string };
  maxScore: number;
  intro: string;
}

export const assessmentModels: AssessmentModel[] = [
  {
    id: "phq9",
    name: "PHQ-9 Depression Screening",
    shortName: "PHQ-9",
    description: "The Patient Health Questionnaire (PHQ-9) is a validated 9-item tool for screening and measuring the severity of depression. Each question asks how often you've been bothered by specific symptoms over the last 2 weeks.",
    questions: phq9Questions,
    getSeverity: getPHQ9Severity,
    maxScore: 27,
    intro: "Over the last 2 weeks, how often have you been bothered by the following problems?",
  },
  {
    id: "gad7",
    name: "GAD-7 Anxiety Screening",
    shortName: "GAD-7",
    description: "The Generalized Anxiety Disorder 7-item scale (GAD-7) measures the severity of anxiety symptoms. It asks about worry, restlessness, and fear over the last 2 weeks. It's one of the most widely used anxiety screening tools.",
    questions: gad7Questions,
    getSeverity: getGAD7Severity,
    maxScore: 21,
    intro: "Over the last 2 weeks, how often have you been bothered by the following problems?",
  },
  {
    id: "who5",
    name: "WHO-5 Wellbeing Index",
    shortName: "WHO-5",
    description: "The WHO-5 is a short, positively framed questionnaire that measures your overall wellbeing over the last 2 weeks. Unlike depression screens, it focuses on positive mental health — higher scores mean better wellbeing.",
    questions: who5Questions,
    getSeverity: getWHO5Severity,
    maxScore: 25,
    intro: "Please indicate for each of the statements which is closest to how you have been feeling over the last 2 weeks.",
  },
  {
    id: "pcptsd5",
    name: "PC-PTSD-5 Trauma Screen",
    shortName: "PC-PTSD-5",
    description: "The Primary Care PTSD Screen (PC-PTSD-5) is a 5-item screen for post-traumatic stress disorder. It asks about symptoms related to a stressful experience. A score of 3 or more suggests possible PTSD requiring further evaluation.",
    questions: pcptsd5Questions,
    getSeverity: getPCPTSD5Severity,
    maxScore: 5,
    intro: "Sometimes things happen to people that are unusually or especially frightening, horrible, or traumatic. In the past month, have you...",
  },
  {
    id: "pss10",
    name: "PSS-10 Stress Assessment",
    shortName: "PSS-10",
    description: "The Perceived Stress Scale (PSS-10) measures how unpredictable, uncontrollable, and overloaded you find your life. It's particularly relevant during exam periods and academic pressure. Higher scores indicate greater perceived stress.",
    questions: pss10Questions,
    getSeverity: getPSS10Severity,
    maxScore: 40,
    intro: "The questions ask about your feelings and thoughts during the last month. For each question, indicate how often you felt or thought a certain way.",
  },
];

export const hopeMessages: HopeMessage[] = [
  {
    id: "1",
    text: "Emotions are not problems to be solved. They are signals to be interpreted.",
    image: "/hope-1.jpg",
    colorClass: "bg-surface-container-low",
    gradientClass: "from-primary to-secondary",
    textClass: "text-on-primary",
  },
  {
    id: "2",
    text: "Self-love first means respecting, accepting, forgiving, and valuing yourself.",
    image: "/hope-2.jpg",
    colorClass: "bg-surface-container-low",
    gradientClass: "from-secondary to-primary",
    textClass: "text-on-secondary-container",
  },
  {
    id: "3",
    text: "Not all wounds are visible. Remember to check on people.",
    image: "/hope-3.jpg",
    colorClass: "bg-surface-container-low",
    gradientClass: "from-outline to-surface-variant",
    textClass: "text-on-surface",
  },
  {
    id: "4",
    text: "Mental health is just health. We don't shame a broken bone; we shouldn't shame a heavy heart.",
    image: "/hope-4.jpg",
    colorClass: "bg-surface-container-low",
    gradientClass: "from-primary-fixed-dim to-primary",
    textClass: "text-on-primary",
  },
  {
    id: "5",
    text: "Men need to know it's okay to feel, to cry, to ask for help, to be vulnerable.",
    image: "/hope-5.jpg",
    colorClass: "bg-surface-container-low",
    gradientClass: "from-secondary-fixed-dim to-secondary",
    textClass: "text-on-secondary",
  },
  {
    id: "6",
    text: "Overthinking is the thief of happiness. Take a deep breath — it's just a bad day, not a bad life.",
    image: "/hope-6.jpg",
    colorClass: "bg-surface-container-low",
    gradientClass: "from-tertiary-fixed-dim to-tertiary-fixed",
    textClass: "text-on-tertiary-fixed",
  },
  {
    id: "7",
    text: "You're not alone in feeling judged. Fear, worry, and self-doubt are common — but they don't define you.",
    image: "/hope-7.jpg",
    colorClass: "bg-surface-container-low",
    gradientClass: "from-primary to-secondary",
    textClass: "text-on-primary",
  },
  {
    id: "8",
    text: "Behind every smile may be a silent battle. Be kind. Start a conversation. You're not alone.",
    image: "/hope-8.jpg",
    colorClass: "bg-surface-container-low",
    gradientClass: "from-secondary to-primary",
    textClass: "text-on-secondary-container",
  },
  {
    id: "9",
    text: "Even if you have only the strength to beg for food, it is the blessing of the Lord.",
    image: "/hope-9.jpg",
    colorClass: "bg-surface-container-low",
    gradientClass: "from-outline to-surface-variant",
    textClass: "text-on-surface",
  },
  {
    id: "10",
    text: "Movement heals. Take care of your body and your mind will follow.",
    image: "/hope-10.jpg",
    colorClass: "bg-surface-container-low",
    gradientClass: "from-primary-fixed-dim to-primary",
    textClass: "text-on-primary",
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
