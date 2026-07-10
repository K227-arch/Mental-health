import { NextRequest, NextResponse } from "next/server";

// NLLB-200 language codes
// Reference: https://github.com/facebookresearch/flores/blob/main/flores200/README.md
const LANG_CODES: Record<string, string> = {
  en: "eng_Latn",
  sw: "swh_Latn",     // Swahili
  lg: "lug_Latn",     // Luganda
  rny: "nyn_Latn",    // Runyankore (Nkore) - supported in NLLB as nyn_Latn
};

const HF_API_URL =
  "https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-600M";

interface TranslateRequest {
  texts: string[];
  targetLang: string;
  sourceLang?: string;
}

async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const sourceCode = LANG_CODES[sourceLang] || "eng_Latn";
  const targetCode = LANG_CODES[targetLang];

  if (!targetCode) {
    throw new Error(`Unsupported language: ${targetLang}`);
  }

  // Skip if same language
  if (sourceCode === targetCode) return text;

  const response = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HF_READ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: text,
      parameters: {
        src_lang: sourceCode,
        tgt_lang: targetCode,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Translation API error: ${response.status} - ${errorText}`);
    throw new Error(`Translation failed: ${response.status}`);
  }

  const result = await response.json();

  // NLLB returns [{translation_text: "..."}]
  if (Array.isArray(result) && result[0]?.translation_text) {
    return result[0].translation_text;
  }

  // Fallback for different response formats
  if (typeof result === "string") return result;
  if (result?.generated_text) return result.generated_text;

  throw new Error("Unexpected response format from translation model");
}

export async function POST(request: NextRequest) {
  try {
    const body: TranslateRequest = await request.json();
    const { texts, targetLang, sourceLang = "en" } = body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: "Missing required field: texts (array of strings)" },
        { status: 400 }
      );
    }

    if (!targetLang) {
      return NextResponse.json(
        { error: "Missing required field: targetLang" },
        { status: 400 }
      );
    }

    if (!LANG_CODES[targetLang]) {
      return NextResponse.json(
        { error: `Unsupported target language: ${targetLang}. Supported: ${Object.keys(LANG_CODES).join(", ")}` },
        { status: 400 }
      );
    }

    // If target is English and source is English, return as-is
    if (targetLang === "en" && sourceLang === "en") {
      return NextResponse.json({ translations: texts }, { status: 200 });
    }

    // Translate all texts (batch — sequential to avoid rate limits)
    const translations: string[] = [];
    for (const text of texts) {
      if (!text || text.trim() === "") {
        translations.push("");
        continue;
      }
      try {
        const translated = await translateText(text, sourceLang, targetLang);
        translations.push(translated);
      } catch {
        // On failure for a single string, return original
        translations.push(text);
      }
    }

    return NextResponse.json({ translations }, { status: 200 });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Translation service temporarily unavailable" },
      { status: 503 }
    );
  }
}
