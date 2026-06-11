import { NextRequest, NextResponse } from "next/server";
import { getAllCampaigns, createCampaign } from "@xeno/db";

export async function GET(req: NextRequest) {
  try {
    const data = await getAllCampaigns();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("GET Campaigns error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, segment_id, channel, message_template, subject_line } = body;
    if (!name || !segment_id || !channel || !message_template) {
      return NextResponse.json({ success: false, error: "name, segment_id, channel, and message_template are required" }, { status: 400 });
    }

    const data = await createCampaign({
      name,
      segment_id,
      channel,
      message_template,
      subject_line
    });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("POST Campaign error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
