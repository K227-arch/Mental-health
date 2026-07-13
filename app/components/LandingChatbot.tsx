"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "bot" | "user";
  text: string;
}

const quickReplies = [
  "How does this work?",
  "Is it confidential?",
  "I need help now",
  "What assessments do you offer?",
];

const botResponses: Record<string, string> = {
  "how does this work?":
    "Selfcare Hub provides confidential AI-powered mental health screening and support. You sign up, take a quick wellness check-in (like the PHQ-9 or GAD-7), and get matched with resources or a counsellor based on your needs. Everything is private and available 24/7. 💚",
  "is it confidential?":
    "Absolutely. Your data is encrypted end-to-end. We use anonymous IDs and your counsellor only sees what you choose to share. No one else — not your university, not your parents — has access. Your privacy is our priority. 🔒",
  "i need help now":
    "I hear you, and I'm glad you reached out. If you're in immediate danger, please call the crisis line at 0800-HELP (toll-free). You can also go to our Crisis Support page for breathing exercises and grounding techniques. You're not alone. 💜\n\n👉 Crisis Support: /crisis",
  "what assessments do you offer?":
    "We offer 5 clinically validated assessments:\n\n• PHQ-9 — Depression screening\n• GAD-7 — Anxiety screening\n• WHO-5 — Wellbeing index\n• PC-PTSD-5 — Trauma screening\n• PSS-10 — Stress assessment\n\nEach takes 3-5 minutes and you'll get AI-powered insights after. Sign up to get started! 📋",
};

function getBotResponse(input: string): string {
  const lower = input.toLowerCase().trim();

  // Check for exact/close matches
  for (const [key, value] of Object.entries(botResponses)) {
    if (lower.includes(key) || key.includes(lower)) return value;
  }

  // Keyword matching
  if (lower.includes("help") || lower.includes("crisis") || lower.includes("emergency") || lower.includes("suicid")) {
    return botResponses["i need help now"];
  }
  if (lower.includes("confiden") || lower.includes("private") || lower.includes("secret") || lower.includes("safe")) {
    return botResponses["is it confidential?"];
  }
  if (lower.includes("how") || lower.includes("work") || lower.includes("what is") || lower.includes("about")) {
    return botResponses["how does this work?"];
  }
  if (lower.includes("assess") || lower.includes("screen") || lower.includes("test") || lower.includes("phq") || lower.includes("gad")) {
    return botResponses["what assessments do you offer?"];
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hey there! 👋 Welcome to Selfcare Hub. I'm here to answer any questions you have about our mental health platform. How can I help you today?";
  }
  if (lower.includes("thank")) {
    return "You're welcome! Remember, you matter and what you're going through matters. Take care of yourself. 💚";
  }
  if (lower.includes("counsell") || lower.includes("therapist") || lower.includes("talk to someone")) {
    return "Once you sign up as a student, you'll be matched with a professional counsellor. You can chat with them securely through our encrypted messaging system. They're real, trained professionals — not bots. 🧑‍⚕️";
  }
  if (lower.includes("free") || lower.includes("cost") || lower.includes("pay")) {
    return "Selfcare Hub is completely free for university students. No hidden costs, no premium tiers. Your mental health shouldn't have a price tag. 💚";
  }
  if (lower.includes("language") || lower.includes("luganda") || lower.includes("swahili") || lower.includes("runyankore")) {
    return "We support 4 languages: English, Luganda, Swahili, and Runyankore. You can switch languages anytime using the language selector. We want everyone to feel comfortable in their mother tongue. 🌍";
  }
  // Research-informed responses based on MUST survey data
  if (lower.includes("tuition") || lower.includes("fees") || lower.includes("broke") || lower.includes("money") || lower.includes("financial")) {
    return "Financial stress is the #2 cause of depression among MUST students (74% of surveyed students reported it). You're not alone in this. Our system can connect you with a counsellor who understands these pressures, and we have resources on coping with financial stress. 💚";
  }
  if (lower.includes("exam") || lower.includes("test") || lower.includes("grade") || lower.includes("retake") || lower.includes("academic")) {
    return "Academic pressure is the #1 reported trigger among MUST students (82%). The workload can feel overwhelming. Our PHQ-9 and PSS-10 assessments can help you understand your stress levels, and we have breathing exercises and study wellness tips in our resources. 📚";
  }
  if (lower.includes("relationship") || lower.includes("heartbreak") || lower.includes("breakup") || lower.includes("partner")) {
    return "Relationship challenges affect 52% of students at MUST. Whether it's a breakup, toxic friendship, or family issues — your feelings are valid. Our assessments can help you process what you're going through, and a counsellor can provide personalized support. 💜";
  }
  if (lower.includes("lonely") || lower.includes("alone") || lower.includes("isolat") || lower.includes("no friends")) {
    return "28% of MUST students report social isolation as a trigger. Being far from family or feeling disconnected is tough. You matter, and reaching out — even here — is a brave step. Our platform is designed to be a bridge when you feel alone. 🤝";
  }
  if (lower.includes("research") || lower.includes("data") || lower.includes("survey") || lower.includes("statistics")) {
    return "Our system is backed by research! We surveyed 404 MUST students and found that 85% suffer in silence, 72% would use an AI chatbot, and the top triggers are academic pressure, financial hardship, and relationships. This data shapes how we support you. 📊";
  }

  return "That's a great question! Selfcare Hub is here to support your mental well-being with AI-powered screening, wellness resources, and access to professional counsellors — all confidential and free. Would you like to know more about how it works, or are you looking for immediate help? 💚";
}

export default function LandingChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hi there! 👋 I'm the Selfcare Hub assistant. Got questions about mental health support? I'm here to help. Ask me anything!" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const response = getBotResponse(text);
      setMessages((prev) => [...prev, { role: "bot", text: response }]);
      setTyping(false);
    }, 800 + Math.random() * 700);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating chat button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
          open ? "bg-on-surface text-surface" : "bg-primary text-on-primary"
        }`}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        <span className="material-symbols-outlined icon-fill text-[26px]">
          {open ? "close" : "chat"}
        </span>
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-140px)] bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="px-4 py-3 bg-primary text-on-primary flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-on-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">Selfcare Hub Assistant</h3>
              <p className="text-[10px] opacity-80">Ask me anything about mental health support</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-container-low/30">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-primary text-on-primary rounded-br-md"
                      : "bg-surface-container-highest text-on-surface rounded-bl-md"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-surface-container-highest text-on-surface-variant px-4 py-2.5 rounded-2xl rounded-bl-md text-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-on-surface-variant/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-on-surface-variant/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-on-surface-variant/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 border-t border-outline-variant/30 flex flex-wrap gap-1.5 shrink-0">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => sendMessage(reply)}
                  className="px-3 py-1.5 bg-surface-container border border-outline-variant rounded-full text-xs font-medium text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="px-3 py-3 border-t border-outline-variant/30 flex items-center gap-2 shrink-0 bg-surface-container-lowest">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 bg-surface-container-low border-none rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface-variant/50"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
