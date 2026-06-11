import { NextRequest, NextResponse } from "next/server";
import { processReceipt } from "@xeno/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messageId, externalId, status, timestamp, failureReason, idempotencyKey } = body;
    
    if (!messageId || !status || !timestamp || !idempotencyKey) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const result = await processReceipt({
      messageId,
      externalId,
      status,
      timestamp,
      failureReason,
      idempotencyKey
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error("Receipt API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
