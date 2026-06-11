import { NextRequest, NextResponse } from "next/server";
import { getCustomerById, getCustomerOrders } from "@xeno/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const customer = await getCustomerById(id);
    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }
    const orders = await getCustomerOrders(id);
    return NextResponse.json({ success: true, data: { ...customer, orders } });
  } catch (err: any) {
    console.error("Customer Detail API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
