/**
 * HuggingFace Inference API integration
 * Keys are loaded from environment variables:
 *   HF_READ_API_KEY   — read/inference key
 *   HF_WRITE_API_KEY  — write key (for fine-tuning, not used here)
 *
 * Used for:
 * - Sentiment analysis on screening text responses
 * - Emotion detection from text
 * - Mental health keyword classification
 * - Text translation (English ↔ Runyankore/Luganda/Swahili via Helsinki-NLP)
 * - PHQ-9 automatic scoring assistance
 */

const HF_API_BASE = "https://api-inference.huggingface.co/models";
// Keys come from .env.local — never hardcoded
const READ_KEY = process.env.HF_READ_API_KEY || "";

// ─── Model IDs ────────────────────────────────────────────────────────────────
const MODELS = {
  sentiment: "cardiffnlp/twitter-roberta-base-sentiment-latest",
  emotion: "j-hartmann/emotion-english-distilroberta-base",
  zeroShot: "facebook/bart-large-mnli",
  translation_sw: "Helsinki-NLP/opus-mt-en-sw",
  translation_en_sw: "Helsinki-NLP/opus-mt-en-swahili",
  summarization: "facebook/bart-large-cnn",
  crisis_detection: "raynardj/ner-disease-ncbi-bionlp-bc5cdr-pubmed-pmc",
};

interface HFResponse {
  label?: string;
  score?: number;
  error?: string;
}

// ─── Core fetch helper ────────────────────────────────────────────────────────
async function hfInference<T>(
  model: string,
  inputs: string | object,
  options?: { wait_for_model?: boolean }
): Promise<T | null> {
  try {
    const res = await fetch(`${HF_API_BASE}/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${READ_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs,
        options: { wait_for_model: true, ...options },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn(`HF inference failed [${model}]:`, text);
      return null;
    }

    return await res.json() as T;
  } catch (e) {
    console.warn(`HF inference error [${model}]:`, e);
    return null;
  }
}

// ─── Sentiment Analysis ───────────────────────────────────────────────────────
export interface SentimentResult {
  label: "POSITIVE" | "NEGATIVE" | "NEUTRAL" | string;
  score: number;
  emoji: string;
  description: string;
}

export async function analyseSentiment(text: string): Promise<SentimentResult> {
  const result = await hfInference<HFResponse[][]>(MODELS.sentiment, text);

  if (!result || !result[0]) {
    return { label: "NEUTRAL", score: 0.5, emoji: "😐", description: "Neutral tone" };
  }

  const top = result[0].reduce((best, cur) =>
    (cur.score ?? 0) > (best.score ?? 0) ? cur : best
  );

  const label = (top.label || "neutral").toUpperCase();
  const score = top.score ?? 0.5;

  const mapping: Record<string, { emoji: string; description: string }> = {
    POSITIVE: { emoji: "🙂", description: "Positive tone detected" },
    NEGATIVE: { emoji: "😔", description: "Negative tone detected" },
    NEUTRAL:  { emoji: "😐", description: "Neutral tone detected" },
  };

  const m = mapping[label] || mapping.NEUTRAL;
  return { label, score, ...m };
}

// ─── Emotion Detection ────────────────────────────────────────────────────────
export type Emotion = "joy" | "sadness" | "anger" | "fear" | "surprise" | "disgust" | "neutral";

export interface EmotionResult {
  dominant: Emotion;
  scores: Record<string, number>;
  emoji: string;
  clinicalNote: string;
}

const EMOTION_EMOJIS: Record<string, string> = {
  joy: "😊", sadness: "😢", anger: "😠", fear: "😰",
  surprise: "😲", disgust: "🤢", neutral: "😐",
};

const EMOTION_CLINICAL: Record<string, string> = {
  joy: "Student appears positive — low immediate risk",
  sadness: "Sadness detected — monitor for depression indicators",
  anger: "Anger/frustration expressed — explore underlying causes",
  fear: "Fear/anxiety present — consider anxiety-focused interventions",
  surprise: "Surprise expressed — evaluate context",
  disgust: "Disgust/aversion detected — explore triggers",
  neutral: "Neutral emotional tone",
};

export async function detectEmotion(text: string): Promise<EmotionResult> {
  const result = await hfInference<HFResponse[][]>(MODELS.emotion, text);

  if (!result || !result[0]) {
    return {
      dominant: "neutral",
      scores: {},
      emoji: "😐",
      clinicalNote: "Unable to analyse emotion",
    };
  }

  const scores: Record<string, number> = {};
  result[0].forEach(r => {
    if (r.label) scores[r.label.toLowerCase()] = r.score ?? 0;
  });

  const dominant = (Object.entries(scores).sort(([, a], [, b]) => b - a)[0]?.[0] || "neutral") as Emotion;

  return {
    dominant,
    scores,
    emoji: EMOTION_EMOJIS[dominant] || "😐",
    clinicalNote: EMOTION_CLINICAL[dominant] || "Neutral emotional tone",
  };
}

// ─── Zero-shot mental health classification ───────────────────────────────────
export interface CrisisClassification {
  isCrisis: boolean;
  confidence: number;
  labels: Record<string, number>;
}

export async function classifyMentalHealthRisk(text: string): Promise<CrisisClassification> {
  const labels = [
    "suicidal ideation",
    "severe depression",
    "anxiety crisis",
    "normal emotional distress",
    "general wellness",
  ];

  const result = await hfInference<{ labels: string[]; scores: number[] }>(
    MODELS.zeroShot,
    { text, candidate_labels: labels }
  );

  if (!result) {
    return { isCrisis: false, confidence: 0, labels: {} };
  }

  const labelMap: Record<string, number> = {};
  result.labels?.forEach((l, i) => { labelMap[l] = result.scores?.[i] ?? 0; });

  const crisisScore =
    (labelMap["suicidal ideation"] ?? 0) * 0.5 +
    (labelMap["severe depression"] ?? 0) * 0.3 +
    (labelMap["anxiety crisis"] ?? 0) * 0.2;

  return {
    isCrisis: crisisScore > 0.4,
    confidence: Math.round(crisisScore * 100),
    labels: labelMap,
  };
}

// ─── Text translation ─────────────────────────────────────────────────────────
export async function translateToSwahili(text: string): Promise<string> {
  const result = await hfInference<Array<{ translation_text: string }>>(
    MODELS.translation_sw,
    text
  );
  return result?.[0]?.translation_text ?? text;
}

// ─── Combined screening analysis ─────────────────────────────────────────────
export interface ScreeningAIAnalysis {
  sentiment: SentimentResult;
  emotion: EmotionResult;
  crisis: CrisisClassification;
  riskScore: number; // 0-100
  summary: string;
}

export async function analyseScreeningResponse(text: string): Promise<ScreeningAIAnalysis> {
  // Run all three in parallel
  const [sentiment, emotion, crisis] = await Promise.all([
    analyseSentiment(text),
    detectEmotion(text),
    classifyMentalHealthRisk(text),
  ]);

  // Composite risk score
  const sentimentRisk = sentiment.label === "NEGATIVE" ? 30 : sentiment.label === "POSITIVE" ? 0 : 15;
  const emotionRisk = ["sadness", "fear", "anger"].includes(emotion.dominant) ? 25 : 0;
  const crisisRisk = crisis.confidence;
  const riskScore = Math.min(100, sentimentRisk + emotionRisk + crisisRisk);

  const summary = [
    `Sentiment: ${sentiment.label} (${Math.round(sentiment.score * 100)}%)`,
    `Dominant emotion: ${emotion.dominant}`,
    crisis.isCrisis ? `⚠️ Crisis indicators detected (${crisis.confidence}% confidence)` : null,
    `AI Risk Score: ${riskScore}/100`,
  ].filter(Boolean).join(" · ");

  return { sentiment, emotion, crisis, riskScore, summary };
}

// ─── Summarise session notes ──────────────────────────────────────────────────
export async function summariseSessionNotes(notes: string): Promise<string> {
  if (notes.length < 100) return notes;

  const result = await hfInference<Array<{ summary_text: string }>>(
    MODELS.summarization,
    notes,
    { wait_for_model: true }
  );

  return result?.[0]?.summary_text ?? notes;
}
