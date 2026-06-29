"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

export type SupportedLang = "en" | "sw" | "lg" | "rny";

export interface LangOption {
  code: SupportedLang;
  label: string;
  nativeLabel: string;
}

export const languages: LangOption[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "sw", label: "Swahili", nativeLabel: "Kiswahili" },
  { code: "lg", label: "Luganda", nativeLabel: "Oluganda" },
  { code: "rny", label: "Runyankore", nativeLabel: "Runyankore" },
];

// Static translations for common UI strings (pre-translated to avoid API calls for core UI)
const staticTranslations: Record<SupportedLang, Record<string, string>> = {
  en: {
    "nav.signin": "Sign In",
    "nav.signup": "Get Started",
    "nav.crisis": "Crisis",
    "nav.features": "Features",
    "nav.about": "About",
    "nav.counsellors": "Counsellors",
    "hero.tagline": "AI-Powered Mental Health",
    "hero.title1": "YOUR MIND",
    "hero.title2": "MATTERS",
    "hero.subtitle": "Confidential AI-powered support for university students. Screening. Tracking. Intervention. Available 24/7.",
    "hero.cta": "Begin Your Journey",
    "hero.crisis": "Crisis Support",
    "hero.scroll": "Scroll",
    "about.label": "Why We Exist",
    "about.title": "1 in 4 students struggle with mental health. Most suffer in silence.",
    "about.description": "Traditional support is inaccessible, stigmatized, and overwhelmed. MindCare AI bridges that gap — confidential, instant, and always available. No waiting lists. No judgment. Just care.",
    "features.label": "Platform",
    "features.title": "Built for your wellbeing",
    "features.subtitle": "Every feature designed with clinical guidance and student feedback.",
    "features.screening": "AI Wellness Screening",
    "features.screening.desc": "PHQ-9 screening powered by NLP models that understand context and emotion.",
    "features.mood": "Mood Intelligence",
    "features.mood.desc": "Track patterns, identify triggers, and receive personalized interventions.",
    "features.privacy": "Private & Encrypted",
    "features.privacy.desc": "End-to-end encryption. Your data never leaves without your consent.",
    "features.counsellor": "Counsellor Connect",
    "features.counsellor.desc": "Seamless escalation to professional counsellors when you need human support.",
    "howItWorks.label": "How It Works",
    "howItWorks.title": "Three steps to feeling better",
    "howItWorks.step1.title": "Check In",
    "howItWorks.step1.desc": "Complete a 3-minute conversational PHQ-9 screening. Our NLP model analyzes your responses for clinical indicators beyond just the score.",
    "howItWorks.step2.title": "Get Insights",
    "howItWorks.step2.desc": "Receive AI-powered analysis of your mental state, mood trends, and personalized recommendations — all private and encrypted.",
    "howItWorks.step3.title": "Take Action",
    "howItWorks.step3.desc": "Access wellness resources, connect with a counsellor, or use crisis support tools. The right help at the right time.",
    "testimonial.quote": "MindCare helped me realize I wasn't alone. The daily check-ins became my anchor during exam season.",
    "testimonial.author": "— 3rd Year Student, MUBS",
    "counsellor.label": "For Professionals",
    "counsellor.title": "Counsellor Dashboard",
    "counsellor.description": "AI-powered risk analytics, real-time alerts, caseload monitoring, and secure student communication. Deliver proactive, data-informed care at scale.",
    "counsellor.signin": "Counsellor Sign In",
    "counsellor.register": "Register",
    "cta.title": "Ready to start?",
    "cta.subtitle": "Free. Confidential. Available 24/7.",
    "cta.button": "Get Started",
    "language.label": "Language",
    "screening.title": "Daily Check-in",
    "screening.subtitle": "Take a moment for yourself. We'll walk through a few questions to understand how you're feeling.",
    "screening.progress": "Question",
    "screening.of": "of",
    "screening.assessment": "PHQ-9 Assessment",
    "dashboard.title": "Dashboard",
    "wellness.title": "Wellness",
  },
  sw: {
    "nav.signin": "Ingia",
    "nav.signup": "Anza",
    "nav.crisis": "Dharura",
    "nav.features": "Huduma",
    "nav.about": "Kuhusu",
    "nav.counsellors": "Washauri",
    "hero.tagline": "Afya ya Akili inayoendeshwa na AI",
    "hero.title1": "AKILI YAKO",
    "hero.title2": "NI MUHIMU",
    "hero.subtitle": "Msaada wa siri wa afya ya akili unaotumia AI kwa wanafunzi wa vyuo vikuu. Uchunguzi. Ufuatiliaji. Uingiliaji. Inapatikana masaa 24/7.",
    "hero.cta": "Anza Safari Yako",
    "hero.crisis": "Msaada wa Dharura",
    "hero.scroll": "Sogeza",
    "about.label": "Kwa Nini Tupo",
    "about.title": "Mwanafunzi 1 kati ya 4 anapambana na afya ya akili. Wengi wanateseka kimya.",
    "about.description": "Msaada wa jadi haupatikani, una unyanyapaa, na umezidiwa. MindCare AI inaziba pengo hilo — siri, ya mara moja, na inapatikana kila wakati. Hakuna orodha ya kusubiri. Hakuna hukumu. Huduma tu.",
    "features.label": "Jukwaa",
    "features.title": "Imejengwa kwa ustawi wako",
    "features.subtitle": "Kila kipengele kimeundwa na mwongozo wa kliniki na maoni ya wanafunzi.",
    "features.screening": "Uchunguzi wa AI",
    "features.screening.desc": "Uchunguzi wa PHQ-9 unaotumia NLP kuelewa muktadha na hisia.",
    "features.mood": "Akili ya Hisia",
    "features.mood.desc": "Fuatilia mifumo, tambua vichochezi, na upokee mapendekezo binafsi.",
    "features.privacy": "Faragha na Usimbaji",
    "features.privacy.desc": "Usimbaji fiche wa mwisho hadi mwisho. Data yako haiondoki bila idhini yako.",
    "features.counsellor": "Unganisha na Mshauri",
    "features.counsellor.desc": "Kupandishwa kwa urahisi kwa washauri wa kitaalamu unapohitaji msaada wa kibinadamu.",
    "howItWorks.label": "Inavyofanya Kazi",
    "howItWorks.title": "Hatua tatu za kujisikia vizuri",
    "howItWorks.step1.title": "Jiandikishe",
    "howItWorks.step1.desc": "Kamilisha uchunguzi wa PHQ-9 wa dakika 3. Modeli yetu ya NLP inachambua majibu yako kwa viashiria vya kliniki zaidi ya alama tu.",
    "howItWorks.step2.title": "Pata Maarifa",
    "howItWorks.step2.desc": "Pokea uchambuzi unaotumia AI wa hali yako ya akili, mienendo ya hisia, na mapendekezo binafsi — yote kwa faragha.",
    "howItWorks.step3.title": "Chukua Hatua",
    "howItWorks.step3.desc": "Fikia rasilimali za ustawi, unganisha na mshauri, au tumia zana za msaada wa dharura. Msaada sahihi kwa wakati sahihi.",
    "testimonial.quote": "MindCare ilinisaidia kutambua kwamba siko peke yangu. Uchunguzi wa kila siku ukawa nanga yangu wakati wa mitihani.",
    "testimonial.author": "— Mwanafunzi wa Mwaka wa 3, MUBS",
    "counsellor.label": "Kwa Wataalamu",
    "counsellor.title": "Dashibodi ya Mshauri",
    "counsellor.description": "Uchambuzi wa hatari unaotumia AI, arifa za wakati halisi, ufuatiliaji wa kesi, na mawasiliano salama na wanafunzi.",
    "counsellor.signin": "Mshauri Ingia",
    "counsellor.register": "Jiandikishe",
    "cta.title": "Uko tayari kuanza?",
    "cta.subtitle": "Bure. Siri. Inapatikana masaa 24/7.",
    "cta.button": "Anza",
    "language.label": "Lugha",
    "screening.title": "Uchunguzi wa Kila Siku",
    "screening.subtitle": "Chukua muda kwa ajili yako. Tutapitia maswali machache kuelewa unavyojisikia.",
    "screening.progress": "Swali",
    "screening.of": "kati ya",
    "screening.assessment": "Tathmini ya PHQ-9",
    "dashboard.title": "Dashibodi",
    "wellness.title": "Ustawi",
  },
  lg: {
    "nav.signin": "Yingira",
    "nav.signup": "Tandika",
    "nav.crisis": "Obuyambi",
    "nav.features": "Ebikola",
    "nav.about": "Ebikwata ku",
    "nav.counsellors": "Abasawo",
    "hero.tagline": "Obulamu bw'Omutwe Obukolebwa AI",
    "hero.title1": "OMUTWE GWO",
    "hero.title2": "GUKULU",
    "hero.subtitle": "Obuyambi bwa kyama obw'obulamu bw'omutwe obukolebwa AI eri abayizi ba yunivaasite. Okukebereza. Okugoberera. Okuyingira mu. Bufunibwa essaawa 24/7.",
    "hero.cta": "Tandika Olugendo Lwo",
    "hero.crisis": "Obuyambi bwa Mangu",
    "hero.scroll": "Seenyiga",
    "about.label": "Lwaki Tuli Wano",
    "about.title": "Omuyizi 1 mu 4 alwana n'obulamu bw'omutwe. Abasinga batabukira mu kasirise.",
    "about.description": "Obuyambi obwabuze tebuliwo, bulina ensonyi, era bulemeddwa. MindCare AI esiba ekirenge ekyo — mu kyama, mangu, era bulifo buli kiseera.",
    "features.label": "Ebyuma",
    "features.title": "Byazimbibwa okukuyamba",
    "features.subtitle": "Buli kintu kyazimbibwa n'obulagirizi bw'abasawo n'ebirowoozo by'abayizi.",
    "features.screening": "Okukebereza kwa AI",
    "features.screening.desc": "Okukebereza kwa PHQ-9 okukozesa NLP okutegeera ebifaananyi n'embeera.",
    "features.mood": "Okutegeera Embeera",
    "features.mood.desc": "Goberera ebiseera, zuula ebikuviirako, era ofune okubuulirira okukubawo.",
    "features.privacy": "Ekyama era Enkripti",
    "features.privacy.desc": "Enkripti okuva ku ntandikwa okutuuka ku nkomerero. Data yo teva nga tokiriziganyizze.",
    "features.counsellor": "Oyungana n'Omusawo",
    "features.counsellor.desc": "Okusenguka okwangu eri abasawo ab'ekikugu bw'oba weetaaga obuyambi bw'omuntu.",
    "howItWorks.label": "Engeri Gy'Ekola",
    "howItWorks.title": "Emitendera esatu okuwulira obulungi",
    "howItWorks.step1.title": "Wandiika",
    "howItWorks.step1.desc": "Tuukiriza okukebereza kwa PHQ-9 okwa eddakiika 3. Enkola yaffe eya NLP ennyannyiriza okuddamu kwo.",
    "howItWorks.step2.title": "Funa Ebirowoozo",
    "howItWorks.step2.desc": "Funa okunnyannyiriza okukozesebwa AI okw'embeera yo ey'omutwe, ebiseera by'embeera, n'okubuulirira okukubawo.",
    "howItWorks.step3.title": "Kola Ekintu",
    "howItWorks.step3.desc": "Funa ebyensimbi by'obulamu, oyungane n'omusawo, oba okozese ebikozesebwa mu buyambi bwa mangu.",
    "testimonial.quote": "MindCare yanyambye okutegeera nti siri nzekka. Okukebereza okwa buli lunaku kwafuuka essaawa yange mu biseera by'ebibuuzo.",
    "testimonial.author": "— Omuyizi ow'Omwaka ogw'3, MUBS",
    "counsellor.label": "Eri Abasawo",
    "counsellor.title": "Dashiboodi y'Omusawo",
    "counsellor.description": "Okunnyannyiriza akabi okukozesa AI, obubaka obwa mangu, okugoberera abalwadde, n'okwogerako n'abayizi mu bwerere.",
    "counsellor.signin": "Omusawo Yingira",
    "counsellor.register": "Wandiika",
    "cta.title": "Oli mwetegefu okutandika?",
    "cta.subtitle": "Bwereere. Kyama. Bufunibwa essaawa 24/7.",
    "cta.button": "Tandika",
    "language.label": "Olulimi",
    "screening.title": "Okukebereza Okwa Buli Lunaku",
    "screening.subtitle": "Twala akaseera kaffe. Tujja kupitira mu bibuuzo bitonotono okutegeera bw'owulira.",
    "screening.progress": "Ekibuuzo",
    "screening.of": "mu",
    "screening.assessment": "Okukebereza PHQ-9",
    "dashboard.title": "Dashiboodi",
    "wellness.title": "Obulamu",
  },
  rny: {
    "nav.signin": "Yingira",
    "nav.signup": "Tandika",
    "nav.crisis": "Obuyambi",
    "nav.features": "Ebikorwa",
    "nav.about": "Ahabw'eky'okukora",
    "nav.counsellors": "Abashaija",
    "hero.tagline": "Obuhangwa bw'Omutwe Obuhinduzibwa AI",
    "hero.title1": "OMUTWE GWAWE",
    "hero.title2": "NIKURU",
    "hero.subtitle": "Obuyambi bwa bwihisho obw'obuhangwa bw'omutwe obuhinduzibwa AI eri abashomi ba yunivaasite. Okwebereza. Okurabirira. Okutegyerera. Buraboneka essaawa 24/7.",
    "hero.cta": "Tandika Orugendo Rwawe",
    "hero.crisis": "Obuyambi bwa Bwangu",
    "hero.scroll": "Serenguza",
    "about.label": "Ahabw'enki Turi Hanu",
    "about.title": "Omushomi 1 omu 4 arwana n'obuhangwa bw'omutwe. Abakira babonabonerwa omu busirise.",
    "about.description": "Obuyambi obugueli teburiho, bufite ensonyi, kandi buremeirwe. MindCare AI ehitsya ekirenge ekyo — omu bwihisho, bwangu, kandi buraboneka buri kiseera.",
    "features.label": "Ebikoresho",
    "features.title": "Byazimbwe okukuyamba",
    "features.subtitle": "Buri kintu kyazimbwe n'oburagirizi bw'abashawo n'ebirowoozo by'abashomi.",
    "features.screening": "Okwebereza kwa AI",
    "features.screening.desc": "Okwebereza kwa PHQ-9 okukozesa NLP okutegyereza ebifaananyi n'embeera.",
    "features.mood": "Okutegyereza Embeera",
    "features.mood.desc": "Rabirira ebiseera, zura ebivirako, kandi obone okuburikirwa okukubawo.",
    "features.privacy": "Bwihisho n'Enkripti",
    "features.privacy.desc": "Enkripti okuva ah'entandikiro okuhitsya ah'enkomerero. Data yawe teruga oti tokiriziganyizze.",
    "features.counsellor": "Oyungana n'Omushawo",
    "features.counsellor.desc": "Okuhinduka okwangu eri abashawo ab'obumanyiire bw'oba weetaaga obuyambi bw'omuntu.",
    "howItWorks.label": "Engeri Eki Ekola",
    "howItWorks.title": "Emirango eshatu okuhurira obulungi",
    "howItWorks.step1.title": "Wandiika",
    "howItWorks.step1.desc": "Tukiririza okwebereza kwa PHQ-9 okw'edakiika 3. Enkora yaitu eya NLP enywanywiriza okugaruka kwawe.",
    "howItWorks.step2.title": "Bona Ebirowoozo",
    "howItWorks.step2.desc": "Bona okunywanywiriza okukozesebwa AI okw'embeera yawe ey'omutwe, ebiseera by'embeera, n'okuburikirwa okukubawo.",
    "howItWorks.step3.title": "Kora Ekintu",
    "howItWorks.step3.desc": "Bona ebyensimbi by'obuhangwa, oyungane n'omushawo, nari okozese ebikozesebwa omu buyambi bwa bwangu.",
    "testimonial.quote": "MindCare yanyambyize okutegyereza ndi nti tindiri nyeka. Okwebereza okwa buri iro kwafuuka essaawa yange omu biseera by'ebibuzo.",
    "testimonial.author": "— Omushomi ow'Omwaka ogw'3, MUBS",
    "counsellor.label": "Eri Abashawo",
    "counsellor.title": "Dashboodi y'Omushawo",
    "counsellor.description": "Okunywanywiriza akabi okukozesa AI, obubaka obwa bwangu, okurabirira abarwaire, n'okwogerako n'abashomi omu bwerere.",
    "counsellor.signin": "Omushawo Yingira",
    "counsellor.register": "Wandiika",
    "cta.title": "Oli mwetegefu okutandika?",
    "cta.subtitle": "Bwereere. Bwihisho. Buraboneka essaawa 24/7.",
    "cta.button": "Tandika",
    "language.label": "Orurimi",
    "screening.title": "Okwebereza Okwa Buri Iro",
    "screening.subtitle": "Twara akaseera kawe. Tukija kupita omu bibuzo bitonotono okutegyereza bw'ohurira.",
    "screening.progress": "Ekibuzo",
    "screening.of": "omu",
    "screening.assessment": "Okwebereza PHQ-9",
    "dashboard.title": "Dashboodi",
    "wellness.title": "Obuhangwa",
  },
};

interface TranslationContextType {
  lang: SupportedLang;
  setLang: (lang: SupportedLang) => void;
  t: (key: string) => string;
  translateDynamic: (texts: string[]) => Promise<string[]>;
  isTranslating: boolean;
}

const TranslationContext = createContext<TranslationContextType>({
  lang: "en",
  setLang: () => {},
  t: (key: string) => key,
  translateDynamic: async (texts: string[]) => texts,
  isTranslating: false,
});

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<SupportedLang>("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const [dynamicCache, setDynamicCache] = useState<Record<string, Record<string, string>>>({});

  // Load saved language preference
  useEffect(() => {
    const saved = localStorage.getItem("mindcare-lang") as SupportedLang | null;
    if (saved && languages.some((l) => l.code === saved)) {
      setLangState(saved);
    }
  }, []);

  const setLang = useCallback((newLang: SupportedLang) => {
    setLangState(newLang);
    localStorage.setItem("mindcare-lang", newLang);
  }, []);

  // Static translation lookup
  const t = useCallback(
    (key: string): string => {
      return staticTranslations[lang]?.[key] || staticTranslations.en[key] || key;
    },
    [lang]
  );

  // Dynamic translation via API (for user-generated content, PHQ-9 questions, etc.)
  const translateDynamic = useCallback(
    async (texts: string[]): Promise<string[]> => {
      if (lang === "en") return texts;

      // Check cache first
      const cacheKey = lang;
      const cached = dynamicCache[cacheKey] || {};
      const uncached: { index: number; text: string }[] = [];

      const results: string[] = texts.map((text, i) => {
        if (cached[text]) return cached[text];
        uncached.push({ index: i, text });
        return text; // placeholder
      });

      if (uncached.length === 0) return results;

      setIsTranslating(true);
      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            texts: uncached.map((u) => u.text),
            targetLang: lang,
            sourceLang: "en",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const newCache = { ...cached };

          uncached.forEach((item, i) => {
            const translated = data.translations[i] || item.text;
            results[item.index] = translated;
            newCache[item.text] = translated;
          });

          setDynamicCache((prev) => ({ ...prev, [cacheKey]: newCache }));
        }
      } catch (error) {
        console.error("Dynamic translation failed:", error);
      } finally {
        setIsTranslating(false);
      }

      return results;
    },
    [lang, dynamicCache]
  );

  return (
    <TranslationContext.Provider value={{ lang, setLang, t, translateDynamic, isTranslating }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  return useContext(TranslationContext);
}
