/**
 * Lightweight i18n for MindCare AI
 * Full AI-based translation is done via /api/ai/translate (HuggingFace Helsinki-NLP)
 * This file provides instant client-side translations for common UI strings
 */

export type Lang = "en" | "sw" | "lg" | "rny";

interface Translations {
  [key: string]: Record<Lang, string>;
}

export const t: Translations = {
  // Navigation
  dashboard: { en: "Dashboard", sw: "Dashibodi", lg: "Dashboard", rny: "Dashboard" },
  screening: { en: "Screening", sw: "Uchunguzi", lg: "Okukebera", rny: "Okureba" },
  wellness: { en: "Wellness", sw: "Afya Njema", lg: "Obulamu Obulunji", rny: "Obuzima" },
  messages: { en: "Messages", sw: "Ujumbe", lg: "Obubaka", rny: "Obubaka" },
  crisis: { en: "Crisis", sw: "Msaada wa Dharura", lg: "Obuyambi mu Kabi", rny: "Obumarwa" },

  // Common actions
  save: { en: "Save", sw: "Hifadhi", lg: "Kubika", rny: "Bika" },
  cancel: { en: "Cancel", sw: "Ghairi", lg: "Siga", rny: "Siga" },
  send: { en: "Send", sw: "Tuma", lg: "Weereza", rny: "Rungika" },
  submit: { en: "Submit", sw: "Wasilisha", lg: "Wegatta", rny: "Tanga" },
  signIn: { en: "Sign In", sw: "Ingia", lg: "Yingira", rny: "Yingira" },
  signOut: { en: "Sign Out", sw: "Toka", lg: "Vaayo", rny: "Fuluma" },
  loading: { en: "Loading…", sw: "Inapakia…", lg: "Tikusobola…", rny: "Tikigurikira…" },

  // Screening
  dailyCheckin: { en: "Daily Check-in", sw: "Ukaguzi wa Kila Siku", lg: "Okukebera kwa Buli Lunaku", rny: "Okureba kw'Eizooba" },
  howAreYou: { en: "How are you feeling right now?", sw: "Unajisikiaje sasa hivi?", lg: "Ojjidde otya?", rny: "Oreeba guta?" },
  phq9: { en: "PHQ-9 Assessment", sw: "Tathmini ya PHQ-9", lg: "Okukebera kwa PHQ-9", rny: "Okureba kwa PHQ-9" },
  notAtAll: { en: "Not at all", sw: "Kabisa la", lg: "Nedda", rny: "Naawe" },
  severalDays: { en: "Several days", sw: "Siku kadhaa", lg: "Ennaku eziwala", rny: "Ennaku nkora" },
  moreThanHalf: { en: "More than half the days", sw: "Zaidi ya nusu ya siku", lg: "Emirundi mingi", rny: "Obukuru bw'ennaku" },
  nearlyEvery: { en: "Nearly every day", sw: "Karibu kila siku", lg: "Buli lunaku", rny: "Buri kyanya" },

  // Crisis
  youAreNotAlone: { en: "You are not alone. Help is here.", sw: "Hujako peke yako. Msaada uko hapa.", lg: "Tosobola wekka. Obuyambi buli wano.", rny: "Toyarukire wenyene. Obufunzo buri hano." },
  emergency: { en: "Emergency", sw: "Dharura", lg: "Emegabirowooza", rny: "Obuziranenge" },
  callCrisisLine: { en: "Call Crisis Line", sw: "Piga Simu ya Msaada", lg: "Kuba essimu y'obuyambi", rny: "Kuba essimu y'obufunzo" },

  // Counsellor
  dashboard_c: { en: "Decision Support Overview", sw: "Muhtasari wa Msaada wa Maamuzi", lg: "Okusumula kw'okuweebwa obuyambi", rny: "Ekirangiro ky'obufunzo" },
  activeSessions: { en: "Active Sessions", sw: "Vikao Vya Sasa", lg: "Okulangirira okuli mu nkola", rny: "Ebiganiro ebirimu" },

  // Wellness
  wellnessHub: { en: "Your Wellness Hub", sw: "Kituo Chako cha Afya", lg: "Ekifo kyo ky'obulamu", rny: "Ekigyendera ky'obuzima" },
};

/**
 * Get a translated string
 * Falls back to English if the key or language is missing
 */
export function tr(key: keyof typeof t, lang: Lang = "en"): string {
  return t[key]?.[lang] ?? t[key]?.["en"] ?? key;
}

/**
 * Get language from localStorage (set by profile page)
 */
export function getLang(): Lang {
  if (typeof window === "undefined") return "en";
  return (localStorage.getItem("mindcare_lang") as Lang) || "en";
}
