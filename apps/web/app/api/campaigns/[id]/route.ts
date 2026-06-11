import { NextRequest, NextResponse } from "next/server";
import { getCampaignById } from "@xeno/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await getCampaignById(id);
    if (!data.campaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Campaign Detail error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
