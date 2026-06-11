import { NextRequest, NextResponse } from "next/server";
import { getAllSegments, createSegment } from "@xeno/db";

export async function GET(req: NextRequest) {
  try {
    const data = await getAllSegments();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("GET Segments error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, rules, is_ai_generated } = body;
    if (!name || !rules || !Array.isArray(rules)) {
      return NextResponse.json({ success: false, error: "name and rules array are required" }, { status: 400 });
    }

    const data = await createSegment({
      name,
      description,
      rules,
      is_ai_generated: !!is_ai_generated
    });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("POST Segment error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
