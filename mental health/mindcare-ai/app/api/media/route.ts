import { NextRequest, NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get("userId");
    const type = searchParams.get("type"); // "audio" or "video"

    const prefix = type && userId ? `${type}/${userId}` : type || "";

    const { data, error } = await insforge.storage
      .from("screening-media")
      .list({ prefix });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Build public URLs
    const objects = data?.objects || [];
    const files = objects.map((file: any) => {
      const path = file.key || file.name;
      const { data: urlData } = insforge.storage
        .from("screening-media")
        .getPublicUrl(path);
      return {
        name: path.split("/").pop() || path,
        path,
        url: urlData?.publicUrl || "",
        createdAt: file.uploadedAt || file.created_at,
        size: file.size || 0,
      };
    });

    return NextResponse.json({ files });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
