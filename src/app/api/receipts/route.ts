import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { messageId, campaignId, customerId, status, timestamp } = await req.json();

    if (!messageId || !campaignId || !customerId || !status) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Missing required callback fields' },
        { status: 400 }
      );
    }

    log(`Callback received for message ${messageId}: status -> ${status}`);

    const date = timestamp ? new Date(timestamp) : new Date();

    // 1. Retrieve the existing message
    const msg = await db.message.findUnique({
      where: { id: messageId }
    });

    if (!msg) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Message record not found in CRM' },
        { status: 404 }
      );
    }

    // 2. Determine fields to update based on status
    const updateData: any = { status };
    if (status === 'sent') updateData.sent_at = date;
    else if (status === 'delivered') updateData.delivered_at = date;
    else if (status === 'opened') updateData.opened_at = date;
    else if (status === 'clicked') updateData.clicked_at = date;

    // Update Message status
    await db.message.update({
      where: { id: messageId },
      data: updateData
    });

    // 3. Log Audit Event
    await db.campaignEvent.create({
      data: {
        message_id: messageId,
        event_type: status,
        timestamp: date
      }
    });

    // 4. If status is clicked, run 7-day revenue attribution check
    if (status === 'clicked') {
      const clickTime = date.getTime();
      const sevenDaysLater = new Date(clickTime + 7 * 24 * 60 * 60 * 1000);

      // Find completed orders for this customer in the 7-day window after clicking
      const unattributedOrders = await db.order.findMany({
        where: {
          customer_id: customerId,
          order_date: {
            gte: date,
            lte: sevenDaysLater
          },
          campaign_id: null,
          status: 'completed'
        }
      });

      if (unattributedOrders.length > 0) {
        log(`Attributing ${unattributedOrders.length} orders to campaign ${campaignId} for customer ${customerId}`);
        
        // Link orders to campaign
        const orderIds = unattributedOrders.map(o => o.id);
        await db.order.updateMany({
          where: { id: { in: orderIds } },
          data: { campaign_id: campaignId }
        });
      }
    }

    // 5. Recalculate campaign statistics in real-time
    const messages = await db.message.findMany({
      where: { campaign_id: campaignId }
    });

    let sent = 0;
    let delivered = 0;
    let opened = 0;
    let clicked = 0;
    let failed = 0;

    messages.forEach((m) => {
      // States are: queued, sent, delivered, opened, clicked, failed
      if (['sent', 'delivered', 'opened', 'clicked'].includes(m.status)) sent++;
      if (['delivered', 'opened', 'clicked'].includes(m.status)) delivered++;
      if (['opened', 'clicked'].includes(m.status)) opened++;
      if (m.status === 'clicked') clicked++;
      if (m.status === 'failed') failed++;
    });

    // Sum attributed revenue
    const revenueAggregate = await db.order.aggregate({
      where: { campaign_id: campaignId, status: 'completed' },
      _sum: { amount: true }
    });

    const revenueAttributed = revenueAggregate._sum.amount || 0.0;

    // Update Campaign stats
    await db.campaign.update({
      where: { id: campaignId },
      data: {
        sent_count: sent,
        delivered_count: delivered,
        opened_count: opened,
        clicked_count: clicked,
        failed_count: failed,
        revenue_attributed: revenueAttributed,
        status: sent === messages.length ? 'completed' : 'running'
      }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in receipt callback:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}

function log(msg: string) {
  console.log(`[API/Receipts] ${msg}`);
}
