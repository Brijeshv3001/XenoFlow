import { NextRequest, NextResponse } from "next/server";
import { getSegmentCustomers } from "@xeno/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await getSegmentCustomers(id);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Segment Customers error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
