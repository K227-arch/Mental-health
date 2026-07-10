import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

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

// ── OpenRouter client ─────────────────────────────────────────────────────────

function getOpenAIClient() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: key,
    defaultHeaders: {
      "HTTP-Referer": "https://rr8rue9y.us-east.insforge.app",
      "X-Title": "MindCare AI",
    },
  });
}

// ── Stage detection ───────────────────────────────────────────────────────────

function detectStageFromHistory(
  messages: ChatMessage[],
  currentStage: ConversationStage,
  nlpContext?: NlpContext
): ConversationStage {
  const msgCount = messages.filter((m) => m.role === "user").length;
  const allText = messages.map((m) => m.content).join(" ").toLowerCase();

  // If NLP flags high risk, jump straight to risk assessment
  if (nlpContext?.riskIndicators?.some((r) =>
    r.toLowerCase().includes("self-harm") ||
    r.toLowerCase().includes("suicidal") ||
    r.toLowerCase().includes("immediate")
  )) {
    return "risk";
  }

  // Manual crisis keywords always trigger risk stage
  const crisisKeywords = ["suicide", "kill myself", "end it all", "better off dead", "self harm", "hurt myself", "cut myself", "no reason to live"];
  if (crisisKeywords.some((kw) => allText.includes(kw))) return "risk";

  // Natural stage progression based on conversation depth
  if (currentStage === "rapport" && msgCount >= 2) return "exploration";
  if (currentStage === "exploration" && msgCount >= 4) return "stressors";
  if (currentStage === "stressors" && msgCount >= 7) {
    // Check if high severity warrants jumping to risk
    if (nlpContext?.phq9Score && nlpContext.phq9Score >= 15) return "risk";
    return "intervention";
  }
  if (currentStage === "risk") return "intervention";

  return currentStage;
}

// ── System prompt per stage ───────────────────────────────────────────────────

function buildSystemPrompt(
  stage: ConversationStage,
  nlpContext?: NlpContext
): string {
  const nlpSummary = nlpContext
    ? `
## Student Assessment Context (from NLP analysis — use to inform your responses)
- Assessment type: ${nlpContext.assessmentType?.toUpperCase() || "PHQ-9"}
- PHQ-9 / screening score: ${nlpContext.phq9Score ?? "not yet completed"}
- NLP classification: ${nlpContext.nlpSeverity || "pending"}
- Confidence: ${nlpContext.confidence ? `${(nlpContext.confidence * 100).toFixed(0)}%` : "N/A"}
- Risk indicators: ${nlpContext.riskIndicators?.length ? nlpContext.riskIndicators.join("; ") : "none detected"}
- Sentiment: ${nlpContext.sentimentBreakdown ? `${(nlpContext.sentimentBreakdown.negative * 100).toFixed(0)}% negative, ${(nlpContext.sentimentBreakdown.positive * 100).toFixed(0)}% positive` : "unknown"}
- AI recommendation: ${nlpContext.recommendation || "none"}
`
    : "";

  const basePersona = `You are MindCare, a compassionate AI mental health support assistant at a university student wellness platform. You are NOT a therapist or doctor — you provide empathetic support, psychoeducation, and crisis safety referrals.

Core principles:
- Always validate emotions before offering advice
- Use reflective listening ("It sounds like...", "I hear that...")
- Never diagnose or prescribe
- Keep responses concise — 2-4 sentences maximum per turn
- Speak like a caring, warm human counsellor — not a chatbot
- Use the student's own words back to them when possible
- End every response with exactly ONE open-ended follow-up question
${nlpSummary}`;

  const stageInstructions: Record<ConversationStage, string> = {
    rapport: `
## Current Stage: 1 — Rapport Building
Goal: Create psychological safety. Make the student feel heard and not judged.
- Open warmly, introduce yourself briefly
- Ask a broad, non-threatening opening question about how they've been feeling emotionally
- Example opener: "Hello, welcome. How have you been feeling emotionally over the last two weeks?"
- Do NOT jump to symptoms or assessments yet
- If they give a short answer, gently invite more: "Tell me more about that."`,

    exploration: `
## Current Stage: 2 — Emotional Exploration
Goal: Understand the dominant emotional landscape. Identify primary feeling states.
- Ask what emotions have been most present recently
- Reflect back what you hear ("It sounds like you've been carrying a lot of...")
- Explore intensity and frequency ("How often does that feeling show up?")
- Example: "What emotions have been most dominant recently — anxiety, sadness, stress, or something else?"
- Do NOT problem-solve yet — just listen and explore`,

    stressors: `
## Current Stage: 3 — Stressor Identification
Goal: Understand the root causes and contributing factors behind their feelings.
- Ask what they think has been contributing to these feelings
- Explore specific life domains: academic pressure, finances, relationships, family, health
- Normalize: many students face similar challenges
- Example: "What factors do you think have contributed to these feelings?"
- Help them name and own their stressors — this is psychoeducation in action`,

    risk: `
## Current Stage: 4 — Risk Assessment
Goal: Sensitively assess for self-harm or suicidal ideation. This is critical.
- Approach with care but directness — avoiding the question can be harmful
- Use the Columbia Protocol approach: "Some people when they feel this way have thoughts of harming themselves or feeling life isn't worth living. Have you had any thoughts like that?"
- If YES: Express care, do NOT panic, ask about plan/intent/means, immediately provide crisis resources
- Crisis line to provide: "Please contact 0800-HELP (24/7, free, confidential) or go to your nearest campus wellness centre"
- If NO: Acknowledge and continue to stage 5
- Example prompt: "Have you had any thoughts of harming yourself or feeling that life is not worth living?"
${nlpContext?.riskIndicators?.length ? `⚠️ NLP has flagged: ${nlpContext.riskIndicators.join(", ")} — treat with appropriate care` : ""}`,

    intervention: `
## Current Stage: 5 — Intervention Planning
Goal: Co-create a concrete next step. Connect student to appropriate support.
- Summarise what you've heard briefly ("Based on what you've shared...")
- Offer a concrete recommendation tailored to their severity level
- Ask if they'd like to be connected to a counsellor
- Provide campus resources: Student Wellness Centre, online booking
- For high severity: "I'd strongly encourage speaking with one of our counsellors — would you like me to arrange that?"
- For moderate: "Have you considered booking a session with a counsellor to talk this through more deeply?"
- For low: "You're doing great by checking in. Keep using these tools and reach out if things shift."
- Example: "Would you like assistance from a counsellor or mental health professional?"
${nlpContext?.recommendation ? `Recommended action from analysis: ${nlpContext.recommendation}` : ""}`,
  };

  return `${basePersona}\n${stageInstructions[stage]}`;
}

// ── Suicide / crisis detection ────────────────────────────────────────────────

function detectCrisis(message: string): boolean {
  const lower = message.toLowerCase();
  const crisisPatterns = [
    "suicide", "suicidal", "kill myself", "kill my self",
    "end my life", "end it all", "better off dead", "want to die",
    "don't want to live", "no reason to live", "self harm", "self-harm",
    "hurt myself", "cut myself", "overdose", "not worth living",
  ];
  return crisisPatterns.some((p) => lower.includes(p));
}

function crisisResponse(): string {
  return "I'm really glad you shared that with me — it takes a lot of courage. Your life matters deeply. Please reach out to the 24/7 crisis line right now: **call or text 0800-HELP** (free and confidential). If you're in immediate danger, please go to the nearest emergency room or call emergency services. I'm here with you — you don't have to face this alone. Can you tell me if you're safe right now?";
}

// ── Keyword extraction ────────────────────────────────────────────────────────

function extractKeywords(messages: ChatMessage[]): string[] {
  const emotionWords = ["anxious", "depressed", "hopeless", "lonely", "stressed", "overwhelmed", "sad", "angry", "scared", "numb", "empty", "exhausted", "worthless", "guilty", "shame"];
  const allText = messages.map((m) => m.content).join(" ").toLowerCase();
  return emotionWords.filter((w) => allText.includes(w));
}

// ── Context interpretation ────────────────────────────────────────────────────

function buildContextInterpretation(
  messages: ChatMessage[],
  stage: ConversationStage,
  nlpContext?: NlpContext
): string {
  const keywords = extractKeywords(messages);
  const userMessages = messages.filter((m) => m.role === "user").map((m) => m.content);
  const recentContext = userMessages.slice(-3).join(". ");

  const parts = [];
  if (keywords.length) parts.push(`Detected emotions: ${keywords.join(", ")}`);
  if (recentContext) parts.push(`Recent context: "${recentContext.slice(0, 200)}"`);
  if (stage) parts.push(`Current conversation stage: ${stage}`);
  if (nlpContext?.phq9Score) parts.push(`Assessment score context: ${nlpContext.phq9Score}/${nlpContext.assessmentType === "gad7" ? 21 : 27}`);

  return parts.join(" | ");
}

// ── Fallback rule-based engine (no LLM available) ────────────────────────────

function fallbackResponse(userMessage: string, stage: ConversationStage, conversationHistory: string[]): string {
  const lower = userMessage.toLowerCase();
  if (detectCrisis(userMessage)) return crisisResponse();

  const allText = conversationHistory.join(" ").toLowerCase();
  const askedSleep = allText.includes("sleep");
  const askedEnergy = allText.includes("energy") || allText.includes("tired");
  const askedAppetite = allText.includes("appetite") || allText.includes("eating");
  const askedConcentration = allText.includes("concentrat") || allText.includes("focus");
  const askedInterest = allText.includes("interest") || allText.includes("enjoy");
  const askedWorth = allText.includes("worth") || allText.includes("failure");

  if (stage === "rapport") return "Hello, welcome. This is a safe, confidential space. How have you been feeling emotionally over the last two weeks?";
  if (stage === "exploration") return "What emotions have been most dominant recently — anxiety, sadness, stress, or something else?";
  if (stage === "stressors") return "What factors do you think have contributed to these feelings?";
  if (stage === "risk") return "Some people when they feel this way have thoughts of harming themselves. Have you had any thoughts like that? If so, please call 0800-HELP (24/7, free).";
  if (stage === "intervention") return "Would you like assistance from a counsellor or mental health professional? I can help connect you.";

  if (!askedSleep) return "How has your sleep been lately — any trouble falling asleep or sleeping too much?";
  if (!askedEnergy) return "How are your energy levels — do you often feel drained or tired?";
  if (!askedAppetite) return "Has this been affecting your appetite or eating habits at all?";
  if (!askedConcentration) return "Have you noticed changes in your ability to concentrate — like on studying or reading?";
  if (!askedInterest) return "Have you lost interest in things that usually bring you joy?";
  if (!askedWorth) return "Have you been having thoughts about yourself being worthless or a failure?";
  return "You've shared a lot today, and your feelings are valid. I'd encourage speaking with a counsellor. Would you be open to that?";
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
    }: {
      messages: { role: string; content: string }[];
      userMessage: string;
      stage: ConversationStage;
      nlpContext?: NlpContext;
    } = body;

    // Always check for crisis first
    if (detectCrisis(userMessage)) {
      return NextResponse.json({
        response: crisisResponse(),
        stage: "risk",
        crisis: true,
      });
    }

    // Build typed message history
    const typedMessages: ChatMessage[] = messages.map((m) => ({
      role: (m.role === "ai" ? "assistant" : m.role) as "user" | "assistant",
      content: m.content,
    }));

    // Determine current stage
    const detectedStage = detectStageFromHistory(typedMessages, clientStage as ConversationStage, nlpContext);

    const openai = getOpenAIClient();

    if (!openai) {
      // No LLM available — use fallback
      const historyStrings = typedMessages.map((m) => m.content);
      const response = fallbackResponse(userMessage, detectedStage, historyStrings);
      return NextResponse.json({ response, stage: detectedStage, crisis: false, usingFallback: true });
    }

    // Build context interpretation for the model
    const contextNote = buildContextInterpretation(typedMessages, detectedStage, nlpContext);

    // Build messages for LLM
    const systemPrompt = buildSystemPrompt(detectedStage, nlpContext);
    const llmMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      // Inject context as system note if available
      ...(contextNote ? [{ role: "system" as const, content: `[Internal context — do not mention directly]: ${contextNote}` }] : []),
      // Include conversation history (last 12 turns to stay within context)
      ...typedMessages.slice(-12),
      // Current user message
      { role: "user", content: userMessage },
    ];

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: llmMessages,
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content?.trim() ||
      fallbackResponse(userMessage, detectedStage, typedMessages.map((m) => m.content));

    // Build explainability output for counsellors
    const explainability = {
      stage: detectedStage,
      detectedEmotions: extractKeywords(typedMessages),
      riskIndicators: nlpContext?.riskIndicators || [],
      nlpSeverity: nlpContext?.nlpSeverity,
      recommendation: nlpContext?.recommendation,
    };

    return NextResponse.json({
      response,
      stage: detectedStage,
      crisis: false,
      explainability,
    });

  } catch (error) {
    console.error("Chat AI error:", error);
    // Graceful fallback — never leave student without a response
    return NextResponse.json({
      response: "I'm here with you. It sounds like a lot is going on — can you tell me more about what's been weighing on you most?",
      stage: "rapport",
      crisis: false,
    });
  }
}
