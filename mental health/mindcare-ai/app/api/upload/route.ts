import { NextRequest, NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    const type = formData.get("type") as string; // "audio" or "video"

    if (!file || !userId) {
      return NextResponse.json({ error: "file and userId required" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || (type === "audio" ? "webm" : "mp4");
    const key = `${type}/${userId}/${Date.now()}.${ext}`;

    const { data, error } = await insforge.storage
      .from("screening-media")
      .upload(key, file);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = insforge.storage
      .from("screening-media")
      .getPublicUrl(key);

    return NextResponse.json({
      url: urlData?.publicUrl || key,
      key,
      type,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
