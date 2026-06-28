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
  classifications: { label: string; score: number }[]
): string[] {
  const indicators: string[] = [];

  // Check question 9 (suicidal ideation)
  const q9 = answers.find((a) => a.question.includes("better off dead") || a.question.includes("hurting yourself"));
  if (q9 && q9.score >= 2) {
    indicators.push("Self-harm ideation detected — immediate follow-up recommended");
  }

  // Check for high scores on key questions
  const anhedonia = answers.find((a) => a.question.includes("interest or pleasure"));
  if (anhedonia && anhedonia.score >= 3) {
    indicators.push("Severe anhedonia — loss of interest in activities");
  }

  const hopelessness = answers.find((a) => a.question.includes("down, depressed, or hopeless"));
  if (hopelessness && hopelessness.score >= 3) {
    indicators.push("Persistent hopelessness reported");
  }

  const sleep = answers.find((a) => a.question.includes("sleep"));
  if (sleep && sleep.score >= 2) {
    indicators.push("Significant sleep disturbance");
  }

  // Check NLP classifications for high-risk labels
  if (classifications) {
    const suicidal = classifications.find(
      (c) => c.label.toLowerCase() === "suicidal" && c.score > 0.3
    );
    if (suicidal) {
      indicators.push(`NLP model flags suicidal risk (confidence: ${(suicidal.score * 100).toFixed(1)}%)`);
    }

    const depression = classifications.find(
      (c) => c.label.toLowerCase() === "depression" && c.score > 0.5
    );
    if (depression) {
      indicators.push(`Depression markers detected (confidence: ${(depression.score * 100).toFixed(1)}%)`);
    }
  }

  return indicators;
}

function generateRecommendation(
  phq9Score: number,
  nlpSeverity: string,
  riskIndicators: string[]
): string {
  const hasSuicidalRisk = riskIndicators.some(
    (r) => r.includes("Self-harm") || r.includes("suicidal")
  );

  if (hasSuicidalRisk || phq9Score >= 20) {
    return "Immediate professional intervention recommended. Please contact your counselor or crisis services. This is not something you need to face alone.";
  }

  if (phq9Score >= 15 || nlpSeverity.includes("Severe")) {
    return "Your responses indicate significant distress. We strongly recommend scheduling a session with a mental health professional. In the meantime, our crisis resources are available 24/7.";
  }

  if (phq9Score >= 10 || nlpSeverity.includes("Moderate")) {
    return "Your wellbeing matters. Consider speaking with a counselor about what you're experiencing. Regular check-ins and self-care practices can make a meaningful difference.";
  }

  if (phq9Score >= 5) {
    return "You're showing some signs of stress. Keep monitoring how you feel, and don't hesitate to reach out if things feel heavier. Small consistent self-care helps.";
  }

  return "Your responses suggest you're managing well. Continue your healthy habits and check in regularly. Prevention is key to long-term wellness.";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers, phq9Score, freeText } = body;

    if (!answers || !Array.isArray(answers) || phq9Score === undefined) {
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
      const mapped = mapToNlpSeverity(classificationData, phq9Score);
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
    const riskIndicators = identifyRiskIndicators(answers, classificationData);

    // Generate recommendation
    const recommendation = generateRecommendation(phq9Score, nlpSeverity, riskIndicators);

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
        error: "Analysis service temporarily unavailable. PHQ-9 score remains valid.",
        fallback: true,
      },
      { status: 503 }
    );
  }
}
