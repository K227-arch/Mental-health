import { NextRequest, NextResponse } from "next/server";
import { analyseScreeningResponse, analyseSentiment, detectEmotion, classifyMentalHealthRisk, summariseSessionNotes } from "@/app/lib/hf";

export async function POST(request: NextRequest) {
  try {
    const { text, type = "full" } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    switch (type) {
      case "sentiment": {
        const result = await analyseSentiment(text);
        return NextResponse.json({ data: result });
      }
      case "emotion": {
        const result = await detectEmotion(text);
        return NextResponse.json({ data: result });
      }
      case "crisis": {
        const result = await classifyMentalHealthRisk(text);
        return NextResponse.json({ data: result });
      }
      case "summarise": {
        const result = await summariseSessionNotes(text);
        return NextResponse.json({ data: { summary: result } });
      }
      case "full":
      default: {
        const result = await analyseScreeningResponse(text);
        return NextResponse.json({ data: result });
      }
    }
  } catch (e) {
    return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
  }
}
