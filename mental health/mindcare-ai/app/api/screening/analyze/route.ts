import { NextRequest, NextResponse } from "next/server";

const HF_API_URL =
  "https://api-inference.huggingface.co/models/rabiaqayyum/autotrain-mental-health-analysis-58535106298";

const SENTIMENT_API_URL =
  "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest";

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

async function classifyMentalHealth(text: string): Promise<{ label: string; score: number }[]> {
  const response = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HF_READ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mental health model error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  // The model returns [[{label, score}, ...]] or [{label, score}, ...]
  return Array.isArray(result[0]) ? result[0] : result;
}

async function analyzeSentiment(text: string): Promise<{ label: string; score: number }[]> {
  const response = await fetch(SENTIMENT_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HF_READ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sentiment model error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return Array.isArray(result[0]) ? result[0] : result;
}

function buildContextText(
  answers: { question: string; answer: string; score: number }[],
  freeText?: string
): string {
  const parts = answers.map(
    (a) => `Q: ${a.question} A: ${a.answer} (severity: ${a.score}/3)`
  );

  let text = parts.join(". ");
  if (freeText && freeText.trim()) {
    text += `. Additional context: ${freeText.trim()}`;
  }
  return text;
}

function mapToNlpSeverity(
  classifications: { label: string; score: number }[],
  phq9Score: number
): { severity: string; confidence: number } {
  if (!classifications || classifications.length === 0) {
    return { severity: "Unknown", confidence: 0 };
  }

  // Get the top prediction
  const sorted = [...classifications].sort((a, b) => b.score - a.score);
  const top = sorted[0];

  // Map model labels to our severity scale
  const labelMap: Record<string, string> = {
    depression: "Moderate to Severe",
    anxiety: "Moderate",
    bipolar: "Moderate to Severe",
    normal: "Minimal",
    "personality disorder": "Moderate",
    stress: "Mild to Moderate",
    suicidal: "Severe - Immediate Attention Required",
  };

  const severity = labelMap[top.label.toLowerCase()] || top.label;
  return { severity, confidence: top.score };
}

function identifyRiskIndicators(
  answers: { question: string; answer: string; score: number }[],
  classifications: { label: string; score: number }[],
  assessmentType?: string
): string[] {
  const indicators: string[] = [];

  // Universal high-score indicators
  const highScoreAnswers = answers.filter((a) => a.score >= 3);
  if (highScoreAnswers.length >= 3) {
    indicators.push(`Multiple severe responses detected (${highScoreAnswers.length} items at maximum)`);
  }

  // Assessment-specific indicators
  if (assessmentType === "phq9" || !assessmentType) {
    const q9 = answers.find((a) => a.question.includes("better off dead") || a.question.includes("hurting yourself"));
    if (q9 && q9.score >= 2) {
      indicators.push("Self-harm ideation detected — immediate follow-up recommended");
    }
    const anhedonia = answers.find((a) => a.question.includes("interest or pleasure"));
    if (anhedonia && anhedonia.score >= 3) {
      indicators.push("Severe anhedonia — loss of interest in activities");
    }
    const hopelessness = answers.find((a) => a.question.includes("down, depressed, or hopeless"));
    if (hopelessness && hopelessness.score >= 3) {
      indicators.push("Persistent hopelessness reported");
    }
  }

  if (assessmentType === "gad7") {
    const worry = answers.find((a) => a.question.includes("stop or control worrying"));
    if (worry && worry.score >= 3) {
      indicators.push("Uncontrollable worry — may indicate generalized anxiety disorder");
    }
    const fear = answers.find((a) => a.question.includes("afraid") || a.question.includes("awful"));
    if (fear && fear.score >= 2) {
      indicators.push("Persistent dread/fear responses");
    }
  }

  if (assessmentType === "pcptsd5") {
    const yesCount = answers.filter((a) => a.score >= 1).length;
    if (yesCount >= 4) {
      indicators.push("Strong PTSD indicators — professional trauma assessment recommended");
    }
    const nightmares = answers.find((a) => a.question.includes("nightmares"));
    if (nightmares && nightmares.score >= 1) {
      indicators.push("Trauma-related nightmares or intrusive thoughts");
    }
    const numb = answers.find((a) => a.question.includes("numb or detached"));
    if (numb && numb.score >= 1) {
      indicators.push("Emotional numbing/detachment from surroundings");
    }
  }

  if (assessmentType === "pss10") {
    const cantCope = answers.find((a) => a.question.includes("could not cope"));
    if (cantCope && cantCope.score >= 3) {
      indicators.push("Severe difficulty coping with daily demands");
    }
    const piling = answers.find((a) => a.question.includes("piling up"));
    if (piling && piling.score >= 3) {
      indicators.push("Overwhelming perception of stress accumulation");
    }
  }

  if (assessmentType === "who5") {
    const lowItems = answers.filter((a) => a.score <= 1);
    if (lowItems.length >= 3) {
      indicators.push("Very low wellbeing across multiple dimensions — depression screening recommended");
    }
  }

  // Sleep indicator (common across models)
  const sleep = answers.find((a) => a.question.includes("sleep"));
  if (sleep && sleep.score >= 2) {
    indicators.push("Significant sleep disturbance");
  }

  // NLP classification indicators
  if (classifications) {
    const suicidal = classifications.find((c) => c.label.toLowerCase() === "suicidal" && c.score > 0.3);
    if (suicidal) {
      indicators.push(`NLP flags suicidal risk (confidence: ${(suicidal.score * 100).toFixed(1)}%)`);
    }
    const depression = classifications.find((c) => c.label.toLowerCase() === "depression" && c.score > 0.5);
    if (depression) {
      indicators.push(`Depression markers detected (confidence: ${(depression.score * 100).toFixed(1)}%)`);
    }
    const anxiety = classifications.find((c) => c.label.toLowerCase() === "anxiety" && c.score > 0.5);
    if (anxiety) {
      indicators.push(`Anxiety markers detected (confidence: ${(anxiety.score * 100).toFixed(1)}%)`);
    }
  }

  return indicators;
}

function generateRecommendation(
  score: number,
  nlpSeverity: string,
  riskIndicators: string[],
  assessmentType?: string,
  maxScore?: number
): string {
  const hasSuicidalRisk = riskIndicators.some(
    (r) => r.includes("Self-harm") || r.includes("suicidal")
  );
  const threshold = maxScore || 27;
  const highPct = score / threshold;

  if (hasSuicidalRisk || highPct >= 0.75) {
    return "Immediate professional intervention recommended. Please contact your counselor or crisis services. You don't have to face this alone.";
  }

  if (highPct >= 0.55 || nlpSeverity.includes("Severe")) {
    if (assessmentType === "gad7") return "Your anxiety levels are significant. We strongly recommend speaking with a mental health professional about anxiety management strategies.";
    if (assessmentType === "pcptsd5") return "Your responses suggest probable PTSD. A detailed trauma assessment with a qualified professional is strongly recommended.";
    if (assessmentType === "pss10") return "You're experiencing high levels of perceived stress. Consider stress management techniques, and speak with a counsellor about coping strategies.";
    if (assessmentType === "who5") return "Your wellbeing is quite low. This may indicate underlying depression or burnout. We recommend a follow-up depression screening and counsellor session.";
    return "Your responses indicate significant distress. We strongly recommend scheduling a session with a mental health professional.";
  }

  if (highPct >= 0.35) {
    if (assessmentType === "gad7") return "You're experiencing moderate anxiety. Regular relaxation exercises, mindfulness, and monitoring can help. Consider discussing this with a counsellor.";
    if (assessmentType === "pss10") return "Moderate stress detected. Try breaking tasks into smaller pieces, ensure adequate sleep, and consider campus wellness resources.";
    if (assessmentType === "who5") return "Your wellbeing could be better. Small daily habits — exercise, social connection, sleep hygiene — can make a meaningful difference.";
    return "Your wellbeing matters. Consider speaking with a counselor about what you're experiencing.";
  }

  if (assessmentType === "who5") return "Your wellbeing scores are good! Keep up your healthy routines and check in regularly to maintain this positive trajectory.";
  return "Your responses suggest you're managing well. Continue your healthy habits and check in regularly.";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers, phq9Score, freeText, assessmentType, maxScore } = body;
    const score = phq9Score; // keeping variable name for backward compat

    if (!answers || !Array.isArray(answers) || score === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: answers (array), phq9Score" },
        { status: 400 }
      );
    }

    const contextText = buildContextText(answers, freeText);

    // Run both models in parallel
    const [classifications, sentimentResults] = await Promise.allSettled([
      classifyMentalHealth(contextText),
      analyzeSentiment(contextText),
    ]);

    // Process mental health classification
    let nlpSeverity = "Unknown";
    let confidence = 0;
    let classificationData: { label: string; score: number }[] = [];

    if (classifications.status === "fulfilled") {
      classificationData = classifications.value;
      const mapped = mapToNlpSeverity(classificationData, score);
      nlpSeverity = mapped.severity;
      confidence = mapped.confidence;
    }

    // Process sentiment
    const sentimentBreakdown = { negative: 0, neutral: 0, positive: 0 };
    if (sentimentResults.status === "fulfilled") {
      for (const item of sentimentResults.value) {
        const label = item.label.toLowerCase();
        if (label === "negative") sentimentBreakdown.negative = item.score;
        else if (label === "neutral") sentimentBreakdown.neutral = item.score;
        else if (label === "positive") sentimentBreakdown.positive = item.score;
      }
    }

    // Identify risk indicators
    const riskIndicators = identifyRiskIndicators(answers, classificationData, assessmentType);

    // Generate recommendation
    const recommendation = generateRecommendation(score, nlpSeverity, riskIndicators, assessmentType, maxScore);

    const result: AnalysisResult = {
      nlpSeverity,
      confidence,
      sentimentBreakdown,
      riskIndicators,
      recommendation,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Screening analysis error:", error);
    return NextResponse.json(
      {
        error: "Analysis service temporarily unavailable. Your assessment score remains valid.",
        fallback: true,
      },
      { status: 503 }
    );
  }
}
