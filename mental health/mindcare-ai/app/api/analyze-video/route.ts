import { NextRequest, NextResponse } from "next/server";

const EMOTION_MODEL_URL =
  "https://api-inference.huggingface.co/models/trpakov/vit-face-expression";

const WHISPER_API_URL =
  "https://api-inference.huggingface.co/models/openai/whisper-large-v3";

const MENTAL_HEALTH_MODEL_URL =
  "https://api-inference.huggingface.co/models/rabiaqayyum/autotrain-mental-health-analysis-58535106298";

const SENTIMENT_API_URL =
  "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest";

interface EmotionResult {
  label: string;
  score: number;
}

interface VideoAnalysisReport {
  emotions: { label: string; score: number }[];
  dominantEmotion: string;
  transcript: string;
  mentalHealthClassification: { label: string; score: number }[];
  sentiment: { negative: number; neutral: number; positive: number };
  riskIndicators: string[];
  summary: string;
}

async function analyzeEmotion(imageBase64: string): Promise<EmotionResult[]> {
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  const response = await fetch(EMOTION_MODEL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HF_READ_API_KEY}`,
      "Content-Type": "application/octet-stream",
    },
    body: new Uint8Array(buffer),
  });

  if (!response.ok) return [];
  const result = await response.json();
  return Array.isArray(result[0]) ? result[0] : (Array.isArray(result) ? result : []);
}

async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const response = await fetch(WHISPER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HF_READ_API_KEY}`,
      "Content-Type": "audio/webm",
    },
    body: new Uint8Array(audioBuffer),
  });

  if (!response.ok) return "";
  const result = await response.json();
  return result.text || "";
}

async function classifyMentalHealth(text: string): Promise<{ label: string; score: number }[]> {
  if (!text || text.trim().length < 10) return [];
  const response = await fetch(MENTAL_HEALTH_MODEL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HF_READ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!response.ok) return [];
  const result = await response.json();
  return Array.isArray(result[0]) ? result[0] : (Array.isArray(result) ? result : []);
}

async function analyzeSentiment(text: string): Promise<{ label: string; score: number }[]> {
  if (!text || text.trim().length < 5) return [];
  const response = await fetch(SENTIMENT_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HF_READ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!response.ok) return [];
  const result = await response.json();
  return Array.isArray(result[0]) ? result[0] : (Array.isArray(result) ? result : []);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { frames, audio } = body;
    // frames: array of base64 image strings
    // audio: base64 encoded audio data

    const report: VideoAnalysisReport = {
      emotions: [],
      dominantEmotion: "unknown",
      transcript: "",
      mentalHealthClassification: [],
      sentiment: { negative: 0, neutral: 0, positive: 0 },
      riskIndicators: [],
      summary: "",
    };

    // 1. Analyze emotions from frames (in parallel)
    if (frames && frames.length > 0) {
      const emotionResults = await Promise.allSettled(
        frames.slice(0, 5).map((frame: string) => analyzeEmotion(frame))
      );

      // Aggregate emotion scores across all frames
      const emotionMap: Record<string, number[]> = {};
      emotionResults.forEach((result) => {
        if (result.status === "fulfilled" && result.value.length > 0) {
          result.value.forEach((e: EmotionResult) => {
            if (!emotionMap[e.label]) emotionMap[e.label] = [];
            emotionMap[e.label].push(e.score);
          });
        }
      });

      // Average scores per emotion
      report.emotions = Object.entries(emotionMap)
        .map(([label, scores]) => ({
          label,
          score: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100,
        }))
        .sort((a, b) => b.score - a.score);

      if (report.emotions.length > 0) {
        report.dominantEmotion = report.emotions[0].label;
      }
    }

    // 2. Transcribe audio
    if (audio) {
      try {
        const audioBuffer = Buffer.from(audio, "base64");
        report.transcript = await transcribeAudio(audioBuffer);
      } catch {
        report.transcript = "";
      }
    }

    // 3. Run mental health classification on transcript
    if (report.transcript) {
      const [mhResults, sentResults] = await Promise.allSettled([
        classifyMentalHealth(report.transcript),
        analyzeSentiment(report.transcript),
      ]);

      if (mhResults.status === "fulfilled") {
        report.mentalHealthClassification = mhResults.value;
      }

      if (sentResults.status === "fulfilled") {
        sentResults.value.forEach((item) => {
          const label = item.label.toLowerCase();
          if (label === "negative") report.sentiment.negative = item.score;
          else if (label === "neutral") report.sentiment.neutral = item.score;
          else if (label === "positive") report.sentiment.positive = item.score;
        });
      }
    }

    // 4. Identify risk indicators
    const { emotions, dominantEmotion, transcript, mentalHealthClassification } = report;

    if (["sad", "fear", "angry", "disgust"].includes(dominantEmotion.toLowerCase())) {
      report.riskIndicators.push(`Dominant facial expression: ${dominantEmotion} (${(emotions[0]?.score * 100).toFixed(0)}%)`);
    }

    if (mentalHealthClassification.length > 0) {
      const top = mentalHealthClassification[0];
      if (["depression", "suicidal", "anxiety"].includes(top.label.toLowerCase()) && top.score > 0.4) {
        report.riskIndicators.push(`Speech analysis indicates: ${top.label} (${(top.score * 100).toFixed(0)}% confidence)`);
      }
    }

    if (report.sentiment.negative > 0.6) {
      report.riskIndicators.push(`High negative sentiment in speech (${(report.sentiment.negative * 100).toFixed(0)}%)`);
    }

    // Check transcript for concerning keywords
    const keywords = ["hopeless", "give up", "no point", "end it", "can't go on", "worthless", "alone", "nobody cares"];
    const foundKeywords = keywords.filter((kw) => transcript.toLowerCase().includes(kw));
    if (foundKeywords.length > 0) {
      report.riskIndicators.push(`Concerning language detected: "${foundKeywords.join('", "')}"`);
    }

    // 5. Generate summary
    const emotionSummary = emotions.length > 0
      ? `Facial analysis: ${emotions.slice(0, 3).map((e) => `${e.label} ${(e.score * 100).toFixed(0)}%`).join(", ")}.`
      : "No facial data available.";

    const speechSummary = transcript
      ? `Speech transcription (${transcript.length} chars) analyzed. Sentiment: ${(report.sentiment.negative * 100).toFixed(0)}% negative, ${(report.sentiment.positive * 100).toFixed(0)}% positive.`
      : "No speech detected in video.";

    const mhSummary = mentalHealthClassification.length > 0
      ? `NLP classification: ${mentalHealthClassification[0].label} (${(mentalHealthClassification[0].score * 100).toFixed(0)}% confidence).`
      : "";

    report.summary = `${emotionSummary} ${speechSummary} ${mhSummary}`.trim();

    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    console.error("Video analysis error:", error);
    return NextResponse.json(
      { error: "Video analysis service temporarily unavailable." },
      { status: 503 }
    );
  }
}
