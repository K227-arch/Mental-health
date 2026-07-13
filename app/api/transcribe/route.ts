import { NextRequest, NextResponse } from "next/server";

const WHISPER_API_URL =
  "https://api-inference.huggingface.co/models/openai/whisper-large-v3";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Audio file required" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const response = await fetch(WHISPER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_READ_API_KEY}`,
        "Content-Type": file.type || "audio/webm",
      },
      body: buffer,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Whisper API error:", errText);
      return NextResponse.json(
        { error: "Transcription service unavailable", fallback: true },
        { status: 503 }
      );
    }

    const result = await response.json();
    const text = result.text || "";

    return NextResponse.json({ text });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
