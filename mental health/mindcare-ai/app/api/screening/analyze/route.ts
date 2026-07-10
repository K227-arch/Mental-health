import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Uses OpenRouter (GPT-4o-mini) for reliable NLP analysis
// Falls back to rule-based scoring if OpenRouter is unavailable

interface AnalysisResult {
  nlpSeverity: string;
  confidence: number;
  sentimentBreakdown: {
    negative: number;
    neutral: number;
    positive: number;
  };
  riskIndicators: string[];
  recommendation: string;
}

function getOpenAI() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: key,
    defaultHeaders: {
      "HTTP-Referer": "https://mindcare-ai-mu.vercel.app",
      "X-Title": "MindCare AI",
    },
  });
}

function buildContextText(
  answers: { question: string; answer: string; score: number }[],
  freeText?: string
): string {
  const parts = answers.map((a) => `Q: ${a.question} — A: ${a.answer} (score: ${a.score}/3)`);
  let text = parts.join(". ");
  if (freeText?.trim()) text += `. Additional context: ${freeText.trim()}`;
  return text;
}

function identifyRiskIndicators(
  answers: { question: string; answer: string; score: number }[],
  assessmentType?: string
): string[] {
  const indicators: string[] = [];

  const highScoreAnswers = answers.filter((a) => a.score >= 3);
  if (highScoreAnswers.length >= 3) {
    indicators.push(`Multiple severe responses detected (${highScoreAnswers.length} items at maximum severity)`);
  }

  if (assessmentType === "phq9" || !assessmentType) {
    const q9 = answers.find((a) => a.question.toLowerCase().includes("better off dead") || a.question.toLowerCase().includes("hurting yourself"));
    if (q9 && q9.score >= 2) indicators.push("Self-harm ideation detected — immediate follow-up recommended");
    const anhedonia = answers.find((a) => a.question.toLowerCase().includes("interest or pleasure"));
    if (anhedonia && anhedonia.score >= 3) indicators.push("Severe anhedonia — loss of interest in activities");
    const hopelessness = answers.find((a) => a.question.toLowerCase().includes("down, depressed, or hopeless"));
    if (hopelessness && hopelessness.score >= 3) indicators.push("Persistent hopelessness reported");
  }

  if (assessmentType === "gad7") {
    const worry = answers.find((a) => a.question.toLowerCase().includes("stop or control worrying"));
    if (worry && worry.score >= 3) indicators.push("Uncontrollable worry — may indicate generalized anxiety disorder");
    const fear = answers.find((a) => a.question.toLowerCase().includes("afraid") || a.question.toLowerCase().includes("awful"));
    if (fear && fear.score >= 2) indicators.push("Persistent dread/fear responses");
  }

  if (assessmentType === "pcptsd5") {
    const yesCount = answers.filter((a) => a.score >= 1).length;
    if (yesCount >= 4) indicators.push("Strong PTSD indicators — professional trauma assessment recommended");
    const nightmares = answers.find((a) => a.question.toLowerCase().includes("nightmares"));
    if (nightmares && nightmares.score >= 1) indicators.push("Trauma-related nightmares or intrusive thoughts");
    const numb = answers.find((a) => a.question.toLowerCase().includes("numb or detached"));
    if (numb && numb.score >= 1) indicators.push("Emotional numbing/detachment from surroundings");
  }

  if (assessmentType === "pss10") {
    const cantCope = answers.find((a) => a.question.toLowerCase().includes("could not cope"));
    if (cantCope && cantCope.score >= 3) indicators.push("Severe difficulty coping with daily demands");
    const piling = answers.find((a) => a.question.toLowerCase().includes("piling up"));
    if (piling && piling.score >= 3) indicators.push("Overwhelming perception of stress accumulation");
  }

  if (assessmentType === "who5") {
    const lowItems = answers.filter((a) => a.score <= 1);
    if (lowItems.length >= 3) indicators.push("Very low wellbeing across multiple dimensions — depression screening recommended");
  }

  const sleep = answers.find((a) => a.question.toLowerCase().includes("sleep"));
  if (sleep && sleep.score >= 2) indicators.push("Significant sleep disturbance");

  return indicators;
}

function generateRecommendation(score: number, nlpSeverity: string, riskIndicators: string[], assessmentType?: string, maxScore?: number): string {
  const hasSuicidalRisk = riskIndicators.some((r) => r.includes("Self-harm") || r.includes("suicidal"));
  const threshold = maxScore || 27;
  const pct = score / threshold;

  if (hasSuicidalRisk || pct >= 0.75) return "Immediate professional intervention recommended. Please contact your counselor or crisis services (0800-HELP). You don't have to face this alone.";
  if (pct >= 0.55 || nlpSeverity.toLowerCase().includes("severe")) {
    if (assessmentType === "gad7") return "Your anxiety levels are significant. We strongly recommend speaking with a mental health professional.";
    if (assessmentType === "pcptsd5") return "Your responses suggest probable PTSD. A detailed trauma assessment with a qualified professional is strongly recommended.";
    if (assessmentType === "pss10") return "You're experiencing high levels of perceived stress. Consider stress management techniques and speak with a counsellor.";
    if (assessmentType === "who5") return "Your wellbeing is quite low. This may indicate underlying depression or burnout. We recommend a counsellor session.";
    return "Your responses indicate significant distress. We strongly recommend scheduling a session with a mental health professional.";
  }
  if (pct >= 0.35) {
    if (assessmentType === "gad7") return "You're experiencing moderate anxiety. Relaxation exercises and mindfulness can help. Consider discussing this with a counsellor.";
    if (assessmentType === "pss10") return "Moderate stress detected. Try breaking tasks into smaller pieces and ensure adequate sleep.";
    if (assessmentType === "who5") return "Your wellbeing could be better. Small daily habits — exercise, social connection, sleep hygiene — can make a meaningful difference.";
    return "Your wellbeing matters. Consider speaking with a counselor about what you're experiencing.";
  }
  if (assessmentType === "who5") return "Your wellbeing scores are good! Keep up your healthy routines and check in regularly.";
  return "Your responses suggest you're managing well. Continue your healthy habits and check in regularly.";
}

// Rule-based severity from score alone (used as fallback)
function scoreBasedSeverity(score: number, maxScore: number, assessmentType?: string): { severity: string; confidence: number } {
  const pct = score / maxScore;
  if (assessmentType === "who5") {
    // Higher = better for WHO-5
    if (pct >= 0.72) return { severity: "High Wellbeing", confidence: 0.85 };
    if (pct >= 0.50) return { severity: "Moderate Wellbeing", confidence: 0.80 };
    if (pct >= 0.28) return { severity: "Low Wellbeing", confidence: 0.80 };
    return { severity: "Very Low Wellbeing", confidence: 0.85 };
  }
  if (pct >= 0.75) return { severity: "Severe", confidence: 0.85 };
  if (pct >= 0.55) return { severity: "Moderately Severe", confidence: 0.80 };
  if (pct >= 0.35) return { severity: "Moderate", confidence: 0.75 };
  if (pct >= 0.15) return { severity: "Mild", confidence: 0.75 };
  return { severity: "Minimal", confidence: 0.85 };
}

// Rule-based sentiment from answers
function scoreBasedSentiment(score: number, maxScore: number): { negative: number; neutral: number; positive: number } {
  const pct = score / maxScore;
  return {
    negative: Math.min(pct * 1.1, 1),
    neutral: Math.max(0.5 - pct * 0.5, 0.05),
    positive: Math.max(1 - pct * 1.5, 0.02),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers, phq9Score, freeText, assessmentType, maxScore } = body;
    const score = phq9Score;

    if (!answers || !Array.isArray(answers) || score === undefined) {
      return NextResponse.json({ error: "Missing required fields: answers (array), phq9Score" }, { status: 400 });
    }

    const effectiveMaxScore = maxScore || 27;
    const contextText = buildContextText(answers, freeText);
    const riskIndicators = identifyRiskIndicators(answers, assessmentType);

    const openai = getOpenAI();

    if (openai) {
      try {
        // Use GPT-4o-mini to classify mental health state and analyze sentiment
        const prompt = `You are a clinical mental health NLP system. Analyze these ${assessmentType?.toUpperCase() || "PHQ-9"} screening responses and return a JSON object.

Responses:
${contextText}

Score: ${score}/${effectiveMaxScore}

Return ONLY valid JSON with this exact structure:
{
  "classification": "one of: Minimal | Mild | Moderate | Moderately Severe | Severe | Mild to Moderate | Moderate to Severe | High Wellbeing | Moderate Wellbeing | Low Wellbeing | Very Low Wellbeing",
  "confidence": 0.0-1.0,
  "sentiment": {
    "negative": 0.0-1.0,
    "neutral": 0.0-1.0,
    "positive": 0.0-1.0
  },
  "additionalRiskIndicators": ["array of any additional risk factors you detect from the text, empty array if none"]
}`;

        const completion = await openai.chat.completions.create({
          model: "openai/gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 300,
          temperature: 0.1,
          response_format: { type: "json_object" },
        });

        const raw = completion.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(raw);

        const nlpSeverity = parsed.classification || scoreBasedSeverity(score, effectiveMaxScore, assessmentType).severity;
        const confidence = parsed.confidence || 0.82;
        const sentimentBreakdown = {
          negative: parsed.sentiment?.negative ?? scoreBasedSentiment(score, effectiveMaxScore).negative,
          neutral: parsed.sentiment?.neutral ?? scoreBasedSentiment(score, effectiveMaxScore).neutral,
          positive: parsed.sentiment?.positive ?? scoreBasedSentiment(score, effectiveMaxScore).positive,
        };

        // Merge LLM-detected indicators with rule-based ones
        const allIndicators = [...new Set([...riskIndicators, ...(parsed.additionalRiskIndicators || [])])];
        const recommendation = generateRecommendation(score, nlpSeverity, allIndicators, assessmentType, effectiveMaxScore);

        return NextResponse.json({
          nlpSeverity,
          confidence,
          sentimentBreakdown,
          riskIndicators: allIndicators,
          recommendation,
        });
      } catch (llmError) {
        console.error("LLM analysis error, using rule-based fallback:", llmError);
        // Fall through to rule-based
      }
    }

    // Rule-based fallback
    const { severity: nlpSeverity, confidence } = scoreBasedSeverity(score, effectiveMaxScore, assessmentType);
    const sentimentBreakdown = scoreBasedSentiment(score, effectiveMaxScore);
    const recommendation = generateRecommendation(score, nlpSeverity, riskIndicators, assessmentType, effectiveMaxScore);

    return NextResponse.json({ nlpSeverity, confidence, sentimentBreakdown, riskIndicators, recommendation });

  } catch (error) {
    console.error("Screening analysis error:", error);
    return NextResponse.json({ error: "Analysis service temporarily unavailable.", fallback: true }, { status: 503 });
  }
}
