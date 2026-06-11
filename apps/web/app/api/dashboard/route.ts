import { NextRequest, NextResponse } from "next/server";
import { getDashboardStats } from "@xeno/db";

export async function GET(req: NextRequest) {
  try {
    const data = await getDashboardStats();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Dashboard API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
