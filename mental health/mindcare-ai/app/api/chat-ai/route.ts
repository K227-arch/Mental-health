import { NextRequest, NextResponse } from "next/server";

// Use smaller Qwen model that's more reliable on HF free tier
const QWEN_API_URL = "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-3B-Instruct";

const SYSTEM_PROMPT = `You are a compassionate mental health support assistant for university students at Selfcare Hub. Your role is to:

1. Have warm, empathetic conversations about mental health
2. Gently assess the student's emotional state using PHQ-9 principles (depression screening)
3. Listen actively and validate their feelings
4. Identify risk indicators like hopelessness, self-harm ideation, isolation, academic pressure, financial stress
5. Provide supportive responses and coping suggestions
6. Never diagnose — instead encourage professional help when needed

PHQ-9 Assessment Areas (weave these naturally into conversation):
- Interest/pleasure in activities
- Feeling down, depressed, hopeless
- Sleep problems
- Energy levels
- Appetite changes
- Self-worth/guilt
- Concentration difficulties
- Psychomotor changes
- Suicidal ideation (handle with extreme care)

Guidelines:
- Be conversational, NOT clinical or interview-like
- Use short, warm responses (2-4 sentences max)
- Ask ONE follow-up question at a time
- If they mention self-harm or suicide, immediately provide crisis resources (0800-HELP)
- Respond in the same language the student uses
- Use emojis sparingly for warmth
- Reference common student stressors: tuition, exams, relationships, isolation, family pressure
- Never say "I'm an AI" or break character — you are their wellness buddy`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// Context-aware fallback responses based on what user said
function getSmartFallback(userMessage: string, messageCount: number): string {
  const lower = userMessage.toLowerCase();
  
  // Crisis detection
  if (lower.includes("suicide") || lower.includes("kill myself") || lower.includes("end it") || lower.includes("better off dead")) {
    return "I'm really glad you told me that. You matter, and there are people who want to help right now. Please call 0800-HELP immediately — it's free and confidential, available 24/7. You don't have to go through this alone. 💜";
  }
  
  // Emotional states
  if (lower.includes("not feeling well") || lower.includes("not okay") || lower.includes("bad") || lower.includes("terrible")) {
    return "I'm sorry you're going through that. Can you tell me a bit more about what's been making you feel this way? Is it something specific, or more of a general heaviness? 💚";
  }
  if (lower.includes("stress") || lower.includes("pressure") || lower.includes("overwhelm")) {
    return "Stress can really weigh on you, especially at university. Is this mostly from academics, or are there other things piling up too — like finances or relationships?";
  }
  if (lower.includes("lonely") || lower.includes("alone") || lower.includes("no one") || lower.includes("isolated")) {
    return "Feeling alone is one of the hardest things to carry. I want you to know that reaching out here is already a strong step. Have you been able to connect with anyone — friends, family, or even classmates — recently?";
  }
  if (lower.includes("sleep") || lower.includes("tired") || lower.includes("exhausted") || lower.includes("insomnia")) {
    return "Sleep troubles can really affect everything else — mood, focus, energy. How long has this been going on? Is it hard to fall asleep, or do you wake up and can't go back?";
  }
  if (lower.includes("anxious") || lower.includes("anxiety") || lower.includes("worried") || lower.includes("panic")) {
    return "Anxiety can feel so overwhelming, like your mind won't stop racing. What tends to trigger it for you? Is it specific situations or more of a constant feeling?";
  }
  if (lower.includes("sad") || lower.includes("crying") || lower.includes("depressed") || lower.includes("hopeless")) {
    return "I hear you, and I'm glad you're sharing this. Feeling like this takes a lot out of you. Have you noticed this affecting your interest in things you usually enjoy?";
  }
  if (lower.includes("exam") || lower.includes("test") || lower.includes("grade") || lower.includes("fail") || lower.includes("retake")) {
    return "Academic pressure is real, and it's okay to feel stressed about it. Many students at MUST go through this. Are you getting enough breaks between studying, or does it feel non-stop?";
  }
  if (lower.includes("money") || lower.includes("tuition") || lower.includes("broke") || lower.includes("afford") || lower.includes("financial")) {
    return "Financial stress is one of the biggest burdens for students. It's completely understandable to feel weighed down by that. Is this affecting other parts of your life too — like sleep or concentration?";
  }
  if (lower.includes("relationship") || lower.includes("breakup") || lower.includes("heartbreak") || lower.includes("partner")) {
    return "Relationship pain hits deep, especially when you're already dealing with campus life. How has this been affecting your day-to-day — your appetite, sleep, motivation?";
  }
  if (lower.includes("everything") || lower.includes("all") || lower.includes("lot") || lower.includes("much")) {
    return "When everything feels like too much at once, it's hard to know where to even start. Let's take it one step at a time. What feels like the heaviest thing on your mind right now?";
  }
  if (lower.includes("don't know") || lower.includes("confused") || lower.includes("lost") || lower.includes("uncertain")) {
    return "That's okay — you don't need to have all the answers right now. Sometimes just naming that you feel lost is a big first step. What would a 'better day' look like for you?";
  }
  if (lower.includes("fine") || lower.includes("okay") || lower.includes("good") || lower.includes("great")) {
    return "I'm glad to hear that! Even when things feel okay, it's good to check in with yourself. Is there anything small that's been bugging you lately that you'd like to talk through?";
  }
  if (lower.includes("family") || lower.includes("parent") || lower.includes("home")) {
    return "Family situations can weigh heavily, especially when you're away at university. Would you like to share what's been going on? Sometimes talking it through helps.";
  }
  if (lower.includes("thank") || lower.includes("helped") || lower.includes("better")) {
    return "I'm really glad this helped, even a little. Remember, you can always come back here whenever you need to talk. Take care of yourself today. 💚";
  }
  
  // Progressive conversation based on message count
  const progressiveResponses = [
    "I appreciate you sharing that. Can you tell me a bit more? What's been the hardest part of your day recently?",
    "Thank you for opening up. How has this been affecting your energy and motivation? Have you noticed changes in how you feel about things you usually enjoy?",
    "I hear you. Has any of this been affecting your sleep or appetite? Sometimes our bodies show stress before we fully recognize it.",
    "You're doing really well by talking about this. Have you been able to concentrate on your studies, or has that been difficult too?",
    "I appreciate your honesty. On the days when this feels heaviest, what helps you get through? Even small things count.",
    "You've shared a lot with me today, and I want you to know your feelings are valid. Based on what you've told me, I think it would really help to talk to a professional counsellor. Would you be open to that?",
  ];
  
  const idx = Math.min(messageCount, progressiveResponses.length - 1);
  return progressiveResponses[idx];
}

export async function POST(request: NextRequest) {
  try {
    const { messages, userMessage } = await request.json();

    const messageCount = messages ? messages.filter((m: any) => m.role === "user").length : 0;

    // Also look at last few messages for context
    const lastUserMessages = messages ? messages.filter((m: any) => m.role === "user").map((m: any) => m.content) : [];
    const conversationContext = lastUserMessages.join(" ").toLowerCase();

    // Build conversation history for Qwen
    const conversationHistory: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // Add previous messages (last 8 for context window)
    if (messages && messages.length > 0) {
      for (const msg of messages.slice(-8)) {
        conversationHistory.push({
          role: msg.role === "ai" ? "assistant" : "user",
          content: msg.content,
        });
      }
    }

    if (userMessage) {
      conversationHistory.push({ role: "user", content: userMessage });
    }

    // Format for Qwen chat template
    const prompt = conversationHistory
      .map((msg) => {
        if (msg.role === "system") return `<|im_start|>system\n${msg.content}<|im_end|>`;
        if (msg.role === "user") return `<|im_start|>user\n${msg.content}<|im_end|>`;
        return `<|im_start|>assistant\n${msg.content}<|im_end|>`;
      })
      .join("\n") + "\n<|im_start|>assistant\n";

    const response = await fetch(QWEN_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_READ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.8,
          top_p: 0.9,
          do_sample: true,
          return_full_text: false,
          stop: ["<|im_end|>", "<|im_start|>"],
        },
      }),
    });

    if (!response.ok) {
      // Use smart fallback based on user's message and conversation stage
      const combinedContext = userMessage ? `${conversationContext} ${userMessage}` : conversationContext;
      const fallback = getSmartFallback(combinedContext || userMessage || "", messageCount);
      return NextResponse.json({ response: fallback });
    }

    const result = await response.json();
    let aiResponse = "";

    if (Array.isArray(result) && result[0]?.generated_text) {
      aiResponse = result[0].generated_text.trim();
    } else if (result?.generated_text) {
      aiResponse = result.generated_text.trim();
    } else if (typeof result === "string") {
      aiResponse = result.trim();
    }

    // Clean up tokens
    aiResponse = aiResponse.replace(/<\|im_end\|>/g, "").replace(/<\|im_start\|>/g, "").replace(/assistant\n?/g, "").trim();

    // If empty or too short, use smart fallback
    if (!aiResponse || aiResponse.length < 10) {
      aiResponse = getSmartFallback(userMessage || "", messageCount);
    }

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("Chat AI error:", error);
    return NextResponse.json({
      response: "I hear you. Can you tell me a bit more about what's been happening? I'd like to understand better.",
    });
  }
}
