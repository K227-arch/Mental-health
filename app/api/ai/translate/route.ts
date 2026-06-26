import { NextRequest, NextResponse } from "next/server";
import { translateToSwahili } from "@/app/lib/hf";

// Basic dictionary for Luganda and Runyankore (common PHQ-9 phrases)
const LUGANDA: Record<string, string> = {
  "Not at all": "Nedda",
  "Several days": "Ennaku eziwala",
  "More than half the days": "Emirundi mingi",
  "Nearly every day": "Buli lunaku",
  "How are you feeling?": "Ojjidde otya?",
  "Daily Check-in": "Okukebera kwa Buli Lunaku",
  "Crisis Support": "Obuyambi mu Kabi",
  "Emergency": "Emegabirowooza",
};

const RUNYANKORE: Record<string, string> = {
  "Not at all": "Naawe",
  "Several days": "Ennaku nkora",
  "More than half the days": "Obukuru bw'ennaku",
  "Nearly every day": "Buri kyanya",
  "How are you feeling?": "Oreeba guta?",
  "Daily Check-in": "Okureba kw'Eizooba",
  "Crisis Support": "Obufunzo mu Mahabuzo",
  "Emergency": "Obuziranenge",
};

export async function POST(request: NextRequest) {
  try {
    const { text, language } = await request.json();
    if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

    let translated = text;

    if (language === "sw") {
      translated = await translateToSwahili(text);
    } else if (language === "lg") {
      translated = LUGANDA[text] || text;
    } else if (language === "rny") {
      translated = RUNYANKORE[text] || text;
    }

    return NextResponse.json({ data: { original: text, translated, language } });
  } catch {
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
