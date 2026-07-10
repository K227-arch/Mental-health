import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// ── AI client — Groq primary (free & fast), OpenRouter fallback ──────────────

function getAIClient(): { client: OpenAI; model: string } | null {
  if (process.env.GROQ_API_KEY) {
    return {
      client: new OpenAI({
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: process.env.GROQ_API_KEY,
      }),
      model: "llama-3.1-8b-instant",
    };
  }
  if (process.env.OPENROUTER_API_KEY) {
    return {
      client: new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
        defaultHeaders: {
          "HTTP-Referer": "https://mindcare-ai-mu.vercel.app",
          "X-Title": "MindCare AI",
        },
      }),
      model: "openai/gpt-4o-mini",
    };
  }
  return null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConversationStage =
  | "rapport"        // Stage 1: Build trust, open-ended welcome
  | "exploration"    // Stage 2: Explore dominant emotions
  | "stressors"      // Stage 3: Identify contributing factors
  | "risk"           // Stage 4: Risk assessment — suicidality, self-harm
  | "intervention";  // Stage 5: Intervention planning, referral

interface NlpContext {
  nlpSeverity?: string;
  confidence?: number;
  riskIndicators?: string[];
  sentimentBreakdown?: { negative: number; neutral: number; positive: number };
  recommendation?: string;
  phq9Score?: number;
  assessmentType?: string;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// ── Stage detection ───────────────────────────────────────────────────────────

function detectStageFromHistory(
  messages: ChatMessage[],
  currentStage: ConversationStage,
  nlpContext?: NlpContext
): ConversationStage {
  const msgCount = messages.filter((m) => m.role === "user").length;
  const allText = messages.map((m) => m.content).join(" ").toLowerCase();

  if (nlpContext?.riskIndicators?.some((r) =>
    r.toLowerCase().includes("self-harm") ||
    r.toLowerCase().includes("suicidal") ||
    r.toLowerCase().includes("immediate")
  )) return "risk";

  const crisisKeywords = ["suicide", "kill myself", "end it all", "better off dead", "self harm", "hurt myself", "cut myself", "no reason to live"];
  if (crisisKeywords.some((kw) => allText.includes(kw))) return "risk";

  if (currentStage === "rapport" && msgCount >= 2) return "exploration";
  if (currentStage === "exploration" && msgCount >= 4) return "stressors";
  if (currentStage === "stressors" && msgCount >= 7) {
    if (nlpContext?.phq9Score && nlpContext.phq9Score >= 15) return "risk";
    return "intervention";
  }
  if (currentStage === "risk") return "intervention";

  return currentStage;
}

// ── System prompt per stage ───────────────────────────────────────────────────

function buildSystemPrompt(stage: ConversationStage, nlpContext?: NlpContext): string {
  const nlpSummary = nlpContext ? `
## Student Assessment Context (use to inform responses — do not quote directly)
- Assessment: ${nlpContext.assessmentType?.toUpperCase() || "PHQ-9"}, Score: ${nlpContext.phq9Score ?? "not yet completed"}
- NLP classification: ${nlpContext.nlpSeverity || "pending"} (${nlpContext.confidence ? `${(nlpContext.confidence * 100).toFixed(0)}% confidence` : "N/A"})
- Risk indicators: ${nlpContext.riskIndicators?.length ? nlpContext.riskIndicators.join("; ") : "none"}
- Sentiment: ${nlpContext.sentimentBreakdown ? `${(nlpContext.sentimentBreakdown.negative * 100).toFixed(0)}% negative` : "unknown"}
- Recommendation: ${nlpContext.recommendation || "none"}` : "";

  const base = `You are MindCare, a compassionate AI mental health support assistant at a university student wellness platform. You are NOT a therapist — you provide empathetic support, psychoeducation, and crisis referrals.

Rules:
- Validate emotions before offering advice
- Use reflective listening ("It sounds like...", "I hear that...")
- Never diagnose or prescribe medication
- Keep responses to 2-4 sentences max
- Always end with ONE open-ended follow-up question
- Speak warmly like a caring human counsellor
${nlpSummary}`;

  const stages: Record<ConversationStage, string> = {
    rapport: `Current Stage: 1 — Rapport Building
Goal: Create psychological safety. Ask a broad, non-threatening question about how they've been feeling.
Example opener: "Hello, welcome. How have you been feeling emotionally over the last two weeks?"`,

    exploration: `Current Stage: 2 — Emotional Exploration
Goal: Understand dominant emotions. Reflect back what you hear.
Example: "What emotions have been most dominant recently — anxiety, sadness, stress, or something else?"`,

    stressors: `Current Stage: 3 — Stressor Identification
Goal: Understand root causes. Explore academic, financial, relationship, and family stressors.
Example: "What factors do you think have contributed to these feelings?"`,

    risk: `Current Stage: 4 — Risk Assessment (handle with great care)
Goal: Sensitively assess for self-harm or suicidal ideation.
Use: "Some people when they feel this way have thoughts of harming themselves. Have you had any thoughts like that?"
If YES: Express care, provide crisis line: "Please call 0800-HELP (24/7, free, confidential)."
${nlpContext?.riskIndicators?.length ? `⚠️ NLP flagged: ${nlpContext.riskIndicators.join(", ")}` : ""}`,

    intervention: `Current Stage: 5 — Intervention Planning
Goal: Co-create a next step. Connect student to support.
Example: "Would you like assistance from a counsellor or mental health professional?"
${nlpContext?.recommendation ? `Recommended action: ${nlpContext.recommendation}` : ""}`,
  };

  return `${base}\n\n${stages[stage]}`;
}

// ── Crisis detection ──────────────────────────────────────────────────────────

function detectCrisis(message: string): boolean {
  const lower = message.toLowerCase();
  return ["suicide", "suicidal", "kill myself", "end my life", "end it all",
    "better off dead", "want to die", "don't want to live", "self harm",
    "self-harm", "hurt myself", "cut myself", "overdose", "not worth living"
  ].some((p) => lower.includes(p));
}

function crisisResponse(): string {
  return "I'm really glad you shared that with me — it takes courage. Your life matters. Please reach out to the 24/7 crisis line right now: **call or text 0800-HELP** (free and confidential). If you're in immediate danger, please go to the nearest emergency room. I'm here with you — can you tell me if you're safe right now?";
}

// ── Keyword extraction ────────────────────────────────────────────────────────

function extractKeywords(messages: ChatMessage[]): string[] {
  const emotionWords = ["anxious", "depressed", "hopeless", "lonely", "stressed", "overwhelmed",
    "sad", "angry", "scared", "numb", "empty", "exhausted", "worthless", "guilty", "shame"];
  const allText = messages.map((m) => m.content).join(" ").toLowerCase();
  return emotionWords.filter((w) => allText.includes(w));
}

// ── Rule-based fallback ───────────────────────────────────────────────────────

function fallbackResponse(stage: ConversationStage, history: string[]): string {
  const all = history.join(" ").toLowerCase();
  const askedSleep = all.includes("sleep");
  const askedEnergy = all.includes("energy") || all.includes("tired");
  const askedAppetite = all.includes("appetite") || all.includes("eating");
  const askedConcentration = all.includes("concentrat") || all.includes("focus");
  const askedInterest = all.includes("interest") || all.includes("enjoy");
  const askedWorth = all.includes("worth") || all.includes("failure");

  if (stage === "rapport") return "Hello, welcome. This is a safe, confidential space. How have you been feeling emotionally over the last two weeks?";
  if (stage === "exploration") return "What emotions have been most dominant recently — anxiety, sadness, stress, or something else?";
  if (stage === "stressors") return "What factors do you think have contributed to these feelings?";
  if (stage === "risk") return "Some people when they feel this way have thoughts of harming themselves. Have you had any thoughts like that? If so, please call 0800-HELP (24/7, free).";
  if (stage === "intervention") return "Would you like assistance from a counsellor or mental health professional? I can help connect you.";

  if (!askedSleep) return "Thank you for sharing. How has your sleep been lately — any trouble falling or staying asleep?";
  if (!askedEnergy) return "How are your energy levels — do you often feel drained or tired throughout the day?";
  if (!askedAppetite) return "Has any of this affected your appetite or eating habits?";
  if (!askedConcentration) return "Have you noticed any changes in your ability to concentrate — like on studying or daily tasks?";
  if (!askedInterest) return "Have you lost interest in things that usually bring you joy?";
  if (!askedWorth) return "Have you been having any negative thoughts about yourself, like feeling worthless or like a failure?";
  return "You've shared a lot today and your feelings are completely valid. I'd encourage speaking with a professional counsellor. Would you be open to that? 💚";
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      messages = [],
      userMessage = "",
      stage: clientStage = "rapport",
      nlpContext,
    } = body;

    // Crisis check always first
    if (detectCrisis(userMessage)) {
      return NextResponse.json({ response: crisisResponse(), stage: "risk", crisis: true });
    }

    const typedMessages: ChatMessage[] = messages.map((m: { role: string; content: string }) => ({
      role: (m.role === "ai" ? "assistant" : m.role) as "user" | "assistant",
      content: m.content,
    }));

    const detectedStage = detectStageFromHistory(typedMessages, clientStage as ConversationStage, nlpContext);
    const ai = getAIClient();

    if (!ai) {
      const response = fallbackResponse(detectedStage, typedMessages.map((m) => m.content));
      return NextResponse.json({ response, stage: detectedStage, crisis: false, usingFallback: true });
    }

    const systemPrompt = buildSystemPrompt(detectedStage, nlpContext);
    const keywords = extractKeywords(typedMessages);
    const contextNote = keywords.length ? `[Detected emotions in conversation: ${keywords.join(", ")}]` : "";

    const llmMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...(contextNote ? [{ role: "system" as const, content: contextNote }] : []),
      ...typedMessages.slice(-10),
      { role: "user", content: userMessage },
    ];

    const completion = await ai.client.chat.completions.create({
      model: ai.model,
      messages: llmMessages,
      max_tokens: 250,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content?.trim() ||
      fallbackResponse(detectedStage, typedMessages.map((m) => m.content));

    return NextResponse.json({
      response,
      stage: detectedStage,
      crisis: false,
      explainability: {
        stage: detectedStage,
        detectedEmotions: keywords,
        riskIndicators: nlpContext?.riskIndicators || [],
        nlpSeverity: nlpContext?.nlpSeverity,
      },
    });

  } catch (error) {
    console.error("Chat AI error:", error);
    return NextResponse.json({
      response: "I'm here with you. It sounds like a lot is going on — can you tell me more about what's been weighing on you most?",
      stage: "rapport",
      crisis: false,
    });
  }
}
