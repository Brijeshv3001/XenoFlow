import { NextRequest, NextResponse } from "next/server";
import { getDb, getSegmentCustomers } from "@xeno/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb();
    const { id: campaignId } = await params;

    // 1. Get campaign + segment
    const camp = await db.query(
      "SELECT * FROM campaigns WHERE id = $1", [campaignId]
    );
    if (!camp.rows[0]) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    const campaign = camp.rows[0];

    if (campaign.status === "running" || campaign.status === "completed") {
      return NextResponse.json({ error: "Campaign is already running or completed" }, { status: 400 });
    }

    // 2. Get customers in segment
    const customers = await getSegmentCustomers(campaign.segment_id);
    if (!customers.length) {
      return NextResponse.json({ error: "Segment is empty" }, { status: 400 });
    }

    // 3. Render messages + insert into DB
    const messageRows = customers.map(c => ({
      id: `msg_${Math.random().toString(36).substr(2, 9)}`,
      campaign_id: campaignId,
      customer_id: c.id,
      rendered_text: renderTemplate(campaign.message_template, c),
      channel: campaign.channel,
      status: "queued",
    }));

    // Batch insert messages
    for (const msg of messageRows) {
      await db.query(`
        INSERT INTO messages (id, campaign_id, customer_id, rendered_text, channel, status)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [msg.id, msg.campaign_id, msg.customer_id, msg.rendered_text, msg.channel, msg.status]);
    }

    // 4. Update campaign status
    await db.query(`
      UPDATE campaigns SET status = 'running', total_recipients = $2, started_at = NOW()
      WHERE id = $1
    `, [campaignId, customers.length]);

    // 5. Call channel service (fire and forget)
    const channelPayload = messageRows.map(m => ({
      messageId: m.id,
      channel: m.channel,
      recipientId: m.customer_id,
      recipient: customers.find(c => c.id === m.customer_id),
      message: m.rendered_text,
      callbackUrl: process.env.CRM_RECEIPT_URL || "http://localhost:3000/api/receipts",
    }));

    const channelServiceUrl = process.env.CHANNEL_SERVICE_URL || "http://localhost:3001";
    fetch(`${channelServiceUrl}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: channelPayload }),
    }).catch(err => console.error("Channel service call failed:", err));

    return NextResponse.json({ ok: true, queued: messageRows.length });
  } catch (err: any) {
    console.error("Send Campaign error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function renderTemplate(template: string, customer: any): string {
  return template
    .replace(/\{\{first_name\}\}/g, customer.name.split(" ")[0])
    .replace(/\{\{last_order_date\}\}/g, customer.last_order_date
      ? new Date(customer.last_order_date).toLocaleDateString("en-IN")
      : "recently")
    .replace(/\{\{total_spent\}\}/g, `₹${Number(customer.total_spent).toLocaleString("en-IN")}`)
    .replace(/\{\{city\}\}/g, customer.city ?? "your city");
}
