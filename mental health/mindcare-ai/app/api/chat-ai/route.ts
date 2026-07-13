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

  // Progressive stage advancement based on conversation depth
  if (currentStage === "rapport" && msgCount >= 1) return "exploration";
  if (currentStage === "exploration" && msgCount >= 3) return "stressors";
  if (currentStage === "stressors" && msgCount >= 5) {
    if (nlpContext?.phq9Score && nlpContext.phq9Score >= 10) return "risk";
    return "risk";
  }
  if (currentStage === "risk" && msgCount >= 7) return "intervention";

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

  // Use exact 5-stage framework prompts
  if (stage === "rapport") return "Hello, welcome. How have you been feeling emotionally over the last two weeks?";
  if (stage === "exploration") return "What emotions have been most dominant recently?";
  if (stage === "stressors") return "What factors do you think have contributed to these feelings?";
  if (stage === "risk") return "Have you had thoughts of harming yourself or feeling that life is not worth living? If so, please know help is available — call 0800-HELP (24/7, free, confidential).";
  if (stage === "intervention") return "Would you like assistance from a counsellor or mental health professional? I can help connect you.";

  // Topical follow-ups for deeper exploration
  const askedSleep = all.includes("sleep");
  const askedEnergy = all.includes("energy") || all.includes("tired");
  const askedAppetite = all.includes("appetite") || all.includes("eating");
  const askedConcentration = all.includes("concentrat") || all.includes("focus");
  const askedInterest = all.includes("interest") || all.includes("enjoy");

  if (!askedSleep) return "Thank you for sharing. How has your sleep been lately — any trouble falling or staying asleep?";
  if (!askedEnergy) return "How are your energy levels — do you often feel drained or tired throughout the day?";
  if (!askedAppetite) return "Has any of this affected your appetite or eating habits?";
  if (!askedConcentration) return "Have you noticed any changes in your ability to concentrate — like on studying or daily tasks?";
  if (!askedInterest) return "Have you lost interest in things that usually bring you joy?";
  return "You've shared a lot today and your feelings are completely valid. Would you like assistance from a counsellor or mental health professional? 💚";
}

// ── Counsellor reporting helpers ──────────────────────────────────────────────

interface CounsellorReport {
  title: string;
  body: string;
  type: "info" | "alert" | "critical";
  module: string;
  stage: string;
  keywords: string[];
}

function buildCounsellorSummary(
  userMessage: string,
  stage: ConversationStage,
  keywords: string[],
  nlpContext?: NlpContext
): string {
  const parts: string[] = [];

  parts.push(`Stage: ${stage}`);
  if (keywords.length > 0) parts.push(`Detected emotions: ${keywords.join(", ")}`);
  if (nlpContext?.nlpSeverity) parts.push(`NLP Severity: ${nlpContext.nlpSeverity}`);
  if (nlpContext?.phq9Score !== undefined) parts.push(`PHQ-9 Score: ${nlpContext.phq9Score}`);
  if (nlpContext?.riskIndicators?.length) parts.push(`Risk: ${nlpContext.riskIndicators.join("; ")}`);
  parts.push(`Latest message: "${userMessage.slice(0, 120)}${userMessage.length > 120 ? "..." : ""}"`);

  return parts.join(" | ");
}

async function sendToCounsellor(report: CounsellorReport) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
    const anonKey = process.env.INSFORGE_API_KEY || process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
    if (!baseUrl || !anonKey) return;

    // Use internal fetch to notifications API
    await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "counsellor-system",
        title: report.title,
        body: `[${report.module}] ${report.body}`,
        type: report.type,
        link: "/counsellor",
      }),
    });
  } catch {
    // Non-blocking — don't fail the chat response if notification fails
  }
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
      userId,
    } = body;

    // Crisis check always first
    if (detectCrisis(userMessage)) {
      // Send crisis alert to counsellor with the user's message
      sendToCounsellor({
        title: "🚨 Crisis Detected in AI Chat",
        body: `Student message: "${userMessage.slice(0, 150)}". Immediate follow-up required.`,
        type: "critical",
        module: "Suicide Detection Engine",
        stage: "risk",
        keywords: [],
      });
      return NextResponse.json({ response: crisisResponse(), stage: "risk", crisis: true });
    }

    const typedMessages: ChatMessage[] = messages.map((m: { role: string; content: string }) => ({
      role: (m.role === "ai" ? "assistant" : m.role) as "user" | "assistant",
      content: m.content,
    }));

    const detectedStage = detectStageFromHistory(typedMessages, clientStage as ConversationStage, nlpContext);
    const keywords = extractKeywords(typedMessages);
    const ai = getAIClient();

    if (!ai) {
      const response = fallbackResponse(detectedStage, typedMessages.map((m) => m.content));

      // Send analysis to counsellor
      sendToCounsellor({
        title: "📊 AI Chat Session Analysis",
        body: buildCounsellorSummary(userMessage, detectedStage, keywords, nlpContext),
        type: keywords.length >= 3 ? "alert" : "info",
        module: "Prompt Engineering Engine",
        stage: detectedStage,
        keywords,
      });

      return NextResponse.json({ response, stage: detectedStage, crisis: false, usingFallback: true });
    }

    const systemPrompt = buildSystemPrompt(detectedStage, nlpContext);
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

    // Send analysis to counsellor on stage transitions or when risk indicators present
    const stageChanged = detectedStage !== clientStage;
    const hasRisk = (nlpContext?.riskIndicators?.length ?? 0) > 0;
    const highEmotionCount = keywords.length >= 3;

    if (stageChanged || hasRisk || highEmotionCount) {
      sendToCounsellor({
        title: stageChanged
          ? `📋 Stage Transition: ${clientStage} → ${detectedStage}`
          : hasRisk
          ? "⚠️ Risk Indicators Active in Chat"
          : "📊 Elevated Emotional Keywords Detected",
        body: buildCounsellorSummary(userMessage, detectedStage, keywords, nlpContext),
        type: hasRisk ? "alert" : "info",
        module: stageChanged ? "Prompt Engineering Engine" : hasRisk ? "Suicide Detection Engine" : "NLP Module",
        stage: detectedStage,
        keywords,
      });
    }

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
