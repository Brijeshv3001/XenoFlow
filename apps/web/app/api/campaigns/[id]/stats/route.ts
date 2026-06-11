import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@xeno/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb();
    const { id } = await params;
    const res = await db.query("SELECT * FROM campaigns WHERE id = $1", [id]);
    if (!res.rows[0]) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
    }
    
    // Automatically flag campaign as completed if all messages have reached a terminal state
    const camp = res.rows[0];
    if (camp.status === 'running') {
      const processedCount = Number(camp.sent_count) + Number(camp.failed_count);
      if (processedCount >= Number(camp.total_recipients) && Number(camp.total_recipients) > 0) {
        await db.query("UPDATE campaigns SET status = 'completed' WHERE id = $1", [id]);
        camp.status = 'completed';
      }
    }

    return NextResponse.json({ success: true, data: camp });
  } catch (err: any) {
    console.error("Campaign stats error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
