import { NextRequest, NextResponse } from "next/server";
import { previewSegment } from "@xeno/db";

export async function POST(req: NextRequest) {
  try {
    const { rules } = await req.json();
    if (!rules || !Array.isArray(rules)) {
      return NextResponse.json({ success: false, error: "rules array is required" }, { status: 400 });
    }

    const data = await previewSegment(rules);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Preview Segment error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
