import { NextRequest, NextResponse } from "next/server";
import { bulkInsertCustomers } from "@xeno/db";

export async function POST(req: NextRequest) {
  try {
    const { customers } = await req.json();
    if (!customers || !Array.isArray(customers)) {
      return NextResponse.json({ success: false, error: "customers array is required" }, { status: 400 });
    }

    const mapped = customers.map(c => ({
      name: c.name,
      email: c.email,
      phone: c.phone || null,
      city: c.city || null,
      state: c.state || null,
      total_spent: Number(c.total_spent || 0),
      order_count: Number(c.order_count || 0),
      last_order_date: c.last_order_date ? new Date(c.last_order_date) : null,
      first_order_date: c.first_order_date ? new Date(c.first_order_date) : null,
      tags: Array.isArray(c.tags) ? c.tags : (c.tags ? c.tags.split(",") : []),
      signup_date: c.signup_date ? new Date(c.signup_date) : new Date()
    }));

    const result = await bulkInsertCustomers(mapped);
    return NextResponse.json({ success: true, count: result.length, data: result });
  } catch (err: any) {
    console.error("Bulk Import API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
