import { NextResponse } from "next/server";
import researchData from "@/data/research-insights.json";

export async function GET() {
  return NextResponse.json(researchData);
}
