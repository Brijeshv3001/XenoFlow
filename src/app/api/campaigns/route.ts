import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildPrismaWhereClause, SegmentRule } from '@/lib/segmentEvaluator';
import { v4 as uuidv4 } from 'uuid';

const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || 'http://localhost:3001/send';

function personalizeMessage(template: string, customer: any) {
  const firstName = customer.name.split(' ')[0] || customer.name;
  const lastOrderDate = customer.last_order_date 
    ? new Date(customer.last_order_date).toISOString().split('T')[0] 
    : 'N/A';
  const loyaltyPoints = Math.round(customer.total_spent * 0.1);
  
  // Calculate favorite category
  let favCategory = 'apparel';
  if (customer.orders && customer.orders.length > 0) {
    const categories = customer.orders.map((o: any) => o.category);
    const counts: any = {};
    let maxCat = categories[0];
    let maxCount = 1;
    for (const cat of categories) {
      counts[cat] = (counts[cat] || 0) + 1;
      if (counts[cat] > maxCount) {
        maxCat = cat;
        maxCount = counts[cat];
      }
    }
    favCategory = maxCat;
  }

  return template
    .replace(/\{\{first_name\}\}/g, firstName)
    .replace(/\{\{last_order_date\}\}/g, lastOrderDate)
    .replace(/\{\{loyalty_points\}\}/g, String(loyaltyPoints))
    .replace(/\{\{product_category\}\}/g, favCategory);
}

export async function GET() {
  try {
    const campaigns = await db.campaign.findMany({
      orderBy: { created_at: 'desc' }
    });
    return NextResponse.json(campaigns);
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name, segmentId, channel, messageTemplate, scheduledAt, sendNow } = await req.json();

    if (!name || !segmentId || !channel || !messageTemplate) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Create Campaign
    const campaign = await db.campaign.create({
      data: {
        name,
        segment_id: segmentId,
        channel,
        message_template: messageTemplate,
        status: sendNow ? 'running' : 'draft',
        scheduled_at: scheduledAt ? new Date(scheduledAt) : null,
        sent_count: 0
      }
    });

    if (sendNow) {
      // 2. Fetch customers in the segment
      const segment = await db.segment.findUnique({
        where: { id: segmentId }
      });

      if (!segment) {
        return NextResponse.json(
          { error: 'Not Found', message: 'Segment not found' },
          { status: 404 }
        );
      }

      const rules = JSON.parse(segment.rules_json) as SegmentRule[];
      const where = buildPrismaWhereClause(rules);
      
      const customers = await db.customer.findMany({
        where,
        include: { orders: true }
      });

      if (customers.length === 0) {
        // Update campaign back to draft or completed with 0 sent
        const updated = await db.campaign.update({
          where: { id: campaign.id },
          data: { status: 'completed' }
        });
        return NextResponse.json(updated);
      }

      // 3. Create Message logs and prepare dispatcher payload
      const messagesToCreate = [];
      const eventsToCreate = [];
      const dispatchMessages = [];

      for (const cust of customers) {
        const messageId = `msg_${uuidv4()}`;
        const personalizedText = personalizeMessage(messageTemplate, cust);

        messagesToCreate.push({
          id: messageId,
          campaign_id: campaign.id,
          customer_id: cust.id,
          status: 'queued'
        });

        eventsToCreate.push({
          id: `evt_${uuidv4()}`,
          message_id: messageId,
          event_type: 'queued'
        });

        dispatchMessages.push({
          id: messageId,
          campaignId: campaign.id,
          customerId: cust.id,
          channel,
          recipientPhone: cust.phone,
          recipientEmail: cust.email,
          message: personalizedText
        });
      }

      // Batch insert message logs in CRM DB
      await db.message.createMany({ data: messagesToCreate });
      await db.campaignEvent.createMany({ data: eventsToCreate });

      // Update Campaign sent count
      await db.campaign.update({
        where: { id: campaign.id },
        data: { sent_count: customers.length }
      });

      // 4. Dispatch to separate Channel Service API asynchronously
      // Run it without blocking the HTTP response
      fetch(CHANNEL_SERVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: dispatchMessages })
      }).catch(err => {
        console.error('Failed to dispatch campaigns to channel service:', err.message);
      });

      // Fetch the updated campaign to return
      const finalCampaign = await db.campaign.findUnique({
        where: { id: campaign.id }
      });

      return NextResponse.json(finalCampaign);
    }

    return NextResponse.json(campaign);

  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
