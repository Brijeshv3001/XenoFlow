import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@xeno/db";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();

    // 1. Get campaigns list
    const campaignsRes = await db.query(`
      SELECT id, name, channel, status, 
             sent_count, delivered_count, opened_count, clicked_count, 
             revenue_attributed, created_at 
      FROM campaigns 
      ORDER BY created_at DESC
    `);

    // 2. Get message trace logs
    const logsRes = await db.query(`
      SELECT m.id, c.name AS campaign_name, cust.name AS customer_name, 
             cust.phone, m.status, m.updated_at
      FROM messages m
      JOIN campaigns c ON m.campaign_id = c.id
      JOIN customers cust ON m.customer_id = cust.id
      ORDER BY m.updated_at DESC
      LIMIT 100
    `);

    // 3. Compute funnel stages
    const totalsRes = await db.query(`
      SELECT COALESCE(SUM(sent_count), 0) AS sent,
             COALESCE(SUM(delivered_count), 0) AS delivered,
             COALESCE(SUM(opened_count), 0) AS opened,
             COALESCE(SUM(clicked_count), 0) AS clicked
      FROM campaigns
    `);
    const totals = totalsRes.rows[0];
    
    const funnelData = [
      { stage: "Sent", count: Number(totals.sent) },
      { stage: "Delivered", count: Number(totals.delivered) },
      { stage: "Opened", count: Number(totals.opened) },
      { stage: "Clicked", count: Number(totals.clicked) },
    ];

    // 4. Compute channel contribution
    const channelsRes = await db.query(`
      SELECT channel, COALESCE(SUM(revenue_attributed), 0) AS revenue
      FROM campaigns
      GROUP BY channel
    `);
    const channelData = channelsRes.rows.map(r => ({
      channel: r.channel.toUpperCase(),
      revenue: Number(r.revenue)
    }));

    // Standardize channels list if some are missing
    const standardChannels = ["WHATSAPP", "EMAIL", "SMS", "RCS"];
    const channelMap = new Map(channelData.map(c => [c.channel, c.revenue]));
    const finalChannelData = standardChannels.map(ch => ({
      channel: ch,
      revenue: channelMap.get(ch) || 0
    }));

    return NextResponse.json({
      success: true,
      campaigns: campaignsRes.rows.map(c => ({
        id: c.id,
        name: c.name,
        channel: c.channel,
        status: c.status,
        sentCount: Number(c.sent_count),
        deliveredCount: Number(c.delivered_count),
        openedCount: Number(c.opened_count),
        clickedCount: Number(c.clicked_count),
        revenueAttributed: Number(c.revenue_attributed),
        createdAt: c.created_at
      })),
      messageLogs: logsRes.rows.map(l => ({
        id: l.id,
        campaignName: l.campaign_name,
        customerName: l.customer_name,
        phone: l.phone,
        status: l.status,
        updatedAt: l.updated_at
      })),
      funnelData,
      channelData: finalChannelData
    });
  } catch (err: any) {
    console.error("Analytics aggregation error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
