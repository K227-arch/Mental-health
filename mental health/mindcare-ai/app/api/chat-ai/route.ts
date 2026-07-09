import { NextRequest, NextResponse } from "next/server";

// Fully local conversational engine — no external API dependency
// Uses PHQ-9 principles to guide conversation naturally

function generateResponse(userMessage: string, conversationHistory: string[]): string {
  const lower = userMessage.toLowerCase();
  const msgCount = conversationHistory.length;

  // Crisis detection - always top priority
  if (lower.includes("suicide") || lower.includes("kill myself") || lower.includes("end it") || lower.includes("better off dead") || lower.includes("self harm") || lower.includes("hurt myself")) {
    return "I'm really glad you told me that. Your life matters. Please call 0800-HELP right now — it's free, confidential, and available 24/7. You don't have to face this alone. I'm here with you. 💜";
  }

  // Track what topics we've already covered to avoid repetition
  const allText = conversationHistory.join(" ").toLowerCase();
  const askedSleep = allText.includes("sleep");
  const askedEnergy = allText.includes("energy") || allText.includes("tired");
  const askedAppetite = allText.includes("appetite") || allText.includes("eating");
  const askedConcentration = allText.includes("concentrat") || allText.includes("focus");
  const askedInterest = allText.includes("interest") || allText.includes("enjoy") || allText.includes("pleasure");
  const askedWorth = allText.includes("worth") || allText.includes("failure") || allText.includes("letting");

  // Greetings
  if (lower.includes("hi") || lower.includes("hello") || lower.includes("hey") || (msgCount === 0 && lower.length < 20)) {
    return "Hey! I'm glad you're here. This is a safe space to talk about whatever's on your mind. How have you been feeling lately? 💚";
  }

  // Feeling bad/unwell
  if (lower.includes("not feeling well") || lower.includes("not okay") || lower.includes("bad") || lower.includes("terrible") || lower.includes("awful")) {
    if (!askedSleep) return "I'm sorry you're feeling that way. It takes courage to say it. Has this been affecting your sleep — trouble falling asleep, or maybe sleeping too much?";
    if (!askedEnergy) return "I hear you. When things feel heavy like this, how are your energy levels throughout the day?";
    if (!askedInterest) return "That sounds really tough. Have you noticed yourself losing interest in things you normally enjoy?";
    return "I appreciate you being open. How long has this been going on — a few days, weeks, or longer?";
  }

  // Stress/pressure
  if (lower.includes("stress") || lower.includes("pressure") || lower.includes("overwhelm") || lower.includes("too much")) {
    if (!askedConcentration) return "That level of pressure is really hard to handle. Has it been affecting your ability to focus on your studies or other tasks?";
    if (!askedSleep) return "Stress really accumulates. How has your sleep been through all this?";
    if (!askedAppetite) return "When we're under this much pressure, our bodies react too. Have you noticed changes in your appetite?";
    return "It sounds like a lot is building up. What feels like the most pressing thing right now?";
  }

  // Loneliness/isolation
  if (lower.includes("lonely") || lower.includes("alone") || lower.includes("isolat") || lower.includes("no friends") || lower.includes("no one")) {
    if (!askedInterest) return "Feeling disconnected is painful. Have you lost interest in going out or doing social activities you used to like?";
    if (!askedWorth) return "Loneliness can make us feel invisible. Have you had thoughts like 'nobody cares' or feeling worthless?";
    return "You're not alone in feeling this way — many students at MUST experience this. What's one small thing that used to make you feel connected?";
  }

  // Sleep issues
  if (lower.includes("sleep") || lower.includes("insomnia") || lower.includes("can't sleep") || lower.includes("sleeping too much")) {
    if (!askedEnergy) return "Sleep problems are exhausting. How has your energy been during the day — do you feel drained even after resting?";
    if (!askedConcentration) return "That really disrupts everything. Has the poor sleep made it harder to concentrate on reading or lectures?";
    return "How many days out of the last two weeks would you say this has been a problem?";
  }

  // Fatigue/energy
  if (lower.includes("tired") || lower.includes("no energy") || lower.includes("exhausted") || lower.includes("drained") || lower.includes("fatigue")) {
    if (!askedAppetite) return "That sounds draining. When you're this exhausted, how's your appetite been — eating more, less, or just no interest in food?";
    if (!askedInterest) return "I can sense how depleted you feel. Have you been able to find joy in anything lately, or does everything feel like too much effort?";
    return "How long have you been feeling this way? Has it been getting worse recently?";
  }

  // Sadness/depression
  if (lower.includes("sad") || lower.includes("crying") || lower.includes("depressed") || lower.includes("hopeless") || lower.includes("empty") || lower.includes("numb")) {
    if (!askedWorth) return "I'm glad you're sharing this. When you feel this way, do you get thoughts about yourself — like feeling like a failure or that you've let people down?";
    if (!askedSleep) return "That heaviness sounds really painful. Has it been messing with your sleep?";
    if (!askedConcentration) return "Your feelings are valid. Has it been hard to focus on things like studying or watching TV?";
    return "How often would you say you feel this way — several days a week, or nearly every day?";
  }

  // Anxiety
  if (lower.includes("anxious") || lower.includes("anxiety") || lower.includes("worried") || lower.includes("panic") || lower.includes("nervous")) {
    if (!askedSleep) return "Anxiety can be so overwhelming. Has it been keeping you up at night or making it hard to relax?";
    if (!askedConcentration) return "When anxiety is high, it often steals our focus. Has it been harder to concentrate on things?";
    return "What tends to trigger it — is it specific situations, or more of a constant background feeling?";
  }

  // Academic problems
  if (lower.includes("exam") || lower.includes("test") || lower.includes("grade") || lower.includes("fail") || lower.includes("retake") || lower.includes("academic") || lower.includes("study")) {
    if (!askedConcentration) return "Academic pressure is one of the biggest stressors for students. Has it been hard to concentrate when you try to study?";
    if (!askedSleep) return "That sounds really stressful. Is the pressure affecting your sleep at all?";
    return "Many students feel this same weight. What would help you feel even a little lighter about it right now?";
  }

  // Financial problems
  if (lower.includes("money") || lower.includes("tuition") || lower.includes("broke") || lower.includes("afford") || lower.includes("financial") || lower.includes("fees") || lower.includes("poverty")) {
    if (!askedEnergy) return "Financial stress is so heavy, especially for students. Has the constant worry been draining your energy?";
    if (!askedAppetite) return "I understand how much that weighs on you. Has it been affecting your eating — skipping meals or anything like that?";
    return "That's a heavy burden to carry while studying. Is there anyone in your life you've been able to talk to about this?";
  }

  // Relationships
  if (lower.includes("relationship") || lower.includes("breakup") || lower.includes("heartbreak") || lower.includes("partner") || lower.includes("boyfriend") || lower.includes("girlfriend") || lower.includes("ex")) {
    if (!askedSleep) return "Relationship pain hits deep. Has this been keeping you awake or affecting your sleep?";
    if (!askedInterest) return "I'm sorry you're going through that. Have you noticed yourself withdrawing from things you used to enjoy?";
    return "Heartbreak takes real time to process. How long ago did this happen?";
  }

  // Family
  if (lower.includes("family") || lower.includes("parent") || lower.includes("home") || lower.includes("mother") || lower.includes("father") || lower.includes("sibling")) {
    if (!askedWorth) return "Family situations can really affect how we see ourselves. Have you been feeling like you've let them down?";
    if (!askedEnergy) return "Carrying family issues while being at university is exhausting. How are your energy levels?";
    return "Family dynamics are complicated, especially from far away. Tell me more about what's happening.";
  }

  // Vague/short responses
  if (lower.includes("everything") || lower.includes("don't know") || lower.includes("idk") || lower.includes("confused") || lower.includes("lost") || lower.includes("nothing")) {
    if (!askedSleep) return "When it all feels unclear, let's start somewhere simple. How has your sleep been the last couple of weeks?";
    if (!askedEnergy) return "That's okay — we can figure it out together. How about your energy? Do you feel tired most of the time?";
    if (!askedInterest) return "You don't have to have all the answers. Have you been able to enjoy or look forward to anything recently?";
    return "Let's take this one thing at a time. What's the single thing that bothers you the most, even if it seems small?";
  }

  // Positive responses
  if (lower.includes("fine") || lower.includes("okay") || lower.includes("good") || lower.includes("alright") || lower.includes("great")) {
    if (msgCount <= 2) return "That's good to hear! Even when things feel okay, it's valuable to check in. Has anything been slightly off lately — even something minor?";
    return "I'm glad. Sometimes we say we're fine out of habit though. If you could change one thing about how you've been feeling, what would it be?";
  }

  // Gratitude/goodbye
  if (lower.includes("thank") || lower.includes("helped") || lower.includes("better") || lower.includes("bye")) {
    return "I'm glad this helped. Remember, you can always come back whenever you need to talk. Take care of yourself today. 💚";
  }

  // Yes/agreement
  if (lower === "yes" || lower === "yeah" || lower === "yep" || lower === "true" || lower === "exactly" || lower === "right") {
    if (!askedSleep) return "I see. And how has your sleep been — any trouble there?";
    if (!askedEnergy) return "Thank you for being honest. What about your energy levels — feeling drained?";
    if (!askedAppetite) return "I appreciate that. Any changes in your appetite or eating habits?";
    if (!askedConcentration) return "Okay. Has it been affecting your ability to concentrate or focus?";
    return "Based on everything you've shared, I'd really encourage speaking with a counsellor who can help more personally. Would you be open to that?";
  }

  // No/disagreement
  if (lower === "no" || lower === "not really" || lower === "nope" || lower === "nah") {
    if (!askedSleep && !askedEnergy) return "Okay, that's good. How about your energy and sleep — any changes there?";
    if (!askedInterest) return "Alright. Have you been able to enjoy activities or hobbies you usually like?";
    if (!askedWorth) return "Good. One more thing — have you had any negative thoughts about yourself lately?";
    return "That's reassuring. Is there anything else on your mind you'd like to talk about?";
  }

  // Default — progressive PHQ-9 themed questions
  if (!askedSleep) return "Thank you for sharing. I'd like to understand better — how has your sleep been lately?";
  if (!askedEnergy) return "I appreciate you telling me that. How about your energy levels — do you feel tired or drained often?";
  if (!askedAppetite) return "I hear you. Has any of this affected your appetite or eating habits?";
  if (!askedConcentration) return "Thank you for being open. Have you noticed changes in your ability to concentrate — like on studying or reading?";
  if (!askedInterest) return "I value your honesty. Have you lost interest in things that usually bring you joy or pleasure?";
  if (!askedWorth) return "You're doing great by talking about this. Have you been having thoughts about yourself being worthless or a failure?";
  return "You've shared a lot with me today, and your feelings are completely valid. I think speaking with a professional counsellor would really help. Would you like me to connect you? 💚";
}

export async function POST(request: NextRequest) {
  try {
    const { messages, userMessage } = await request.json();

    // Build conversation history as simple strings
    const history: string[] = [];
    if (messages) {
      for (const msg of messages) {
        history.push(msg.content || "");
      }
    }

    // Generate contextual response
    const response = generateResponse(userMessage || "", history);

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat AI error:", error);
    return NextResponse.json({
      response: "I'm here for you. What's been on your mind lately?",
    });
  }
}
