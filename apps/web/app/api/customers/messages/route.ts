import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@xeno/db";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    if (session.role !== "customer" || !session.customerId) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    const db = getDb();
    
    // Query to join messages with campaigns
    const query = `
      SELECT m.*, c.name as campaign_name, c.subject_line 
      FROM messages m
      JOIN campaigns c ON m.campaign_id = c.id
      WHERE m.customer_id = $1
      ORDER BY m.updated_at DESC
    `;
    
    const res = await db.query(query, [session.customerId]);
    
    return NextResponse.json({ success: true, messages: res.rows });
  } catch (err: any) {
    console.error("Customer messages API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
