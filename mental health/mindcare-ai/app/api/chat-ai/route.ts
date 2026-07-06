import { NextRequest, NextResponse } from "next/server";

const QWEN_API_URL = "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct";

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

export async function POST(request: NextRequest) {
  try {
    const { messages, userMessage } = await request.json();

    // Build conversation history for Qwen
    const conversationHistory: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // Add previous messages
    if (messages && messages.length > 0) {
      for (const msg of messages.slice(-10)) { // Keep last 10 for context
        conversationHistory.push({
          role: msg.role === "ai" ? "assistant" : "user",
          content: msg.content,
        });
      }
    }

    // Add the new user message
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
          max_new_tokens: 200,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true,
          return_full_text: false,
          stop: ["<|im_end|>", "<|im_start|>"],
        },
      }),
    });

    if (!response.ok) {
      // Fallback response if Qwen is unavailable
      const fallbackResponses = [
        "I hear you. That sounds really tough. Can you tell me more about how this has been affecting your daily life?",
        "Thank you for sharing that with me. How long have you been feeling this way?",
        "I appreciate you opening up. Has this been affecting your sleep or energy levels?",
        "That takes courage to share. On a scale of how often this happens — would you say it's several days, more than half the days, or nearly every day?",
        "I'm here for you. Have you been able to find interest or pleasure in things you usually enjoy?",
      ];
      const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
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

    // Clean up any remaining tokens
    aiResponse = aiResponse.replace(/<\|im_end\|>/g, "").replace(/<\|im_start\|>/g, "").trim();

    // If empty, use fallback
    if (!aiResponse) {
      aiResponse = "I'm listening. Can you tell me a bit more about what's been on your mind lately?";
    }

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("Chat AI error:", error);
    return NextResponse.json({
      response: "I'm here for you. Sometimes it helps just to talk. What's been weighing on you the most recently?",
    });
  }
}
