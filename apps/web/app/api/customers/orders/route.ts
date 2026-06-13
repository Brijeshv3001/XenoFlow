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
    const res = await db.query(
      "SELECT * FROM orders WHERE customer_id = $1 ORDER BY order_date DESC",
      [session.customerId]
    );

    return NextResponse.json({ success: true, orders: res.rows });
  } catch (err: any) {
    console.error("Customer orders API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
