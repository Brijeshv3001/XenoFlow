import { NextRequest, NextResponse } from "next/server";
import { getCustomers } from "@xeno/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const search = searchParams.get("search") || undefined;
    const city = searchParams.get("city") || undefined;
    const tag = searchParams.get("tag") || undefined;
    const sortBy = searchParams.get("sortBy") || "total_spent";
    const sortDir = (searchParams.get("sortDir") || "desc") as "asc" | "desc";

    const data = await getCustomers({ page, limit, search, city, tag, sortBy, sortDir });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Customers API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
