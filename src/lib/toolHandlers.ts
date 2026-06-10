import { db } from './db';
import { buildPrismaWhereClause, SegmentRule } from './segmentEvaluator';
import { v4 as uuidv4 } from 'uuid';

const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || 'http://localhost:3001/send';

export async function query_customers(filters: any) {
  const where: any = {};
  
  if (filters.rfm_score) {
    where.rfm_score = filters.rfm_score;
  }
  
  if (filters.city) {
    where.city = filters.city;
  }
  
  if (filters.tags) {
    where.tags = { contains: filters.tags };
  }
  
  if (filters.min_spent !== undefined) {
    where.total_spent = { gte: parseFloat(filters.min_spent) };
  }
  
  if (filters.order_count_min !== undefined) {
    where.order_count = { gte: parseInt(filters.order_count_min, 10) };
  }
  
  if (filters.max_days_since_order !== undefined) {
    const now = new Date("2026-06-09T22:50:43+05:30");
    const refDate = new Date(now.getTime() - parseInt(filters.max_days_since_order, 10) * 24 * 60 * 60 * 1000);
    where.last_order_date = { gte: refDate };
  }

  const count = await db.customer.count({ where });
  const sample = await db.customer.findMany({
    where,
    take: 5,
    select: { id: true, name: true, email: true, total_spent: true, city: true, rfm_score: true }
  });

  return {
    count,
    sampleCustomers: sample
  };
}

export async function create_segment(name: string, description: string, rules: any[]) {
  const where = buildPrismaWhereClause(rules as SegmentRule[]);
  const count = await db.customer.count({ where });

  const segment = await db.segment.create({
    data: {
      name,
      description: description || '',
      rules_json: JSON.stringify(rules),
      customer_count: count
    }
  });

  return {
    success: true,
    segmentId: segment.id,
    customerCount: count
  };
}

export async function get_campaign_stats(campaign_id?: string) {
  if (campaign_id) {
    const campaign = await db.campaign.findUnique({
      where: { id: campaign_id }
    });
    return { campaign };
  }

  const campaigns = await db.campaign.findMany({
    orderBy: { created_at: 'desc' }
  });
  return { campaigns };
}

export async function create_campaign(name: string, segment_id: string, channel: string, message: string, send_now: boolean) {
  const campaign = await db.campaign.create({
    data: {
      name,
      segment_id,
      channel,
      message_template: message,
      status: send_now ? 'running' : 'draft',
      sent_count: 0
    }
  });

  if (send_now) {
    const segment = await db.segment.findUnique({
      where: { id: segment_id }
    });

    if (segment) {
      const rules = JSON.parse(segment.rules_json) as SegmentRule[];
      const where = buildPrismaWhereClause(rules);
      const customers = await db.customer.findMany({ where });

      if (customers.length > 0) {
        const messagesToCreate = [];
        const eventsToCreate = [];
        const dispatchMessages = [];

        for (const cust of customers) {
          const messageId = `msg_${uuidv4()}`;
          const firstName = cust.name.split(' ')[0] || cust.name;
          const loyalty = Math.round(cust.total_spent * 0.1);
          const personalizedText = message
            .replace(/\{\{first_name\}\}/g, firstName)
            .replace(/\{\{loyalty_points\}\}/g, String(loyalty));

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

        await db.message.createMany({ data: messagesToCreate });
        await db.campaignEvent.createMany({ data: eventsToCreate });
        await db.campaign.update({
          where: { id: campaign.id },
          data: { sent_count: customers.length }
        });

        fetch(CHANNEL_SERVICE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: dispatchMessages })
        }).catch(err => console.error('AI trigger campaign error:', err));
      }
    }
  }

  return campaign;
}

export async function generate_message_variants(goal: string, channel: string, tone?: string) {
  const t = tone || 'friendly';
  
  // Custom copy drafts based on goal and channel
  const variants = [
    {
      tone: 'friendly',
      subject: channel === 'Email' ? 'We missed you, {{first_name}}! ❤️' : null,
      content: channel === 'Email' 
        ? `Hey {{first_name}},\n\nIt's been a while since we saw you at Lumé. We've added fresh new arrivals in {{product_category}} we think you'll love! Use code **BACK10** for 10% off your next purchase.\n\nBest,\nLumé Team`
        : `Hey {{first_name}}! We miss you at Lumé. Check out our fresh arrivals in {{product_category}} and get 10% off with code *BACK10*! 🌸 lume.in/new`
    },
    {
      tone: 'urgent',
      subject: channel === 'Email' ? '24 Hours Only: {{first_name}}, your special discount is expiring!' : null,
      content: channel === 'Email'
        ? `Hi {{first_name}},\n\nWe wanted to win you back! Here is a special 15% discount code **LIMITED15** valid only for the next 24 hours. Don't miss out on grabbing your favorites!\n\nShop now: lume.in`
        : `Hi {{first_name}}! 🚨 Win-back special: Get 15% off everything on Lumé with code *LIMITED15*. Valid for 24 hours only! Grab yours: lume.in`
    },
    {
      tone: 'exclusive',
      subject: channel === 'Email' ? 'Exclusive Lumé VIP Reward inside, {{first_name}} 💎' : null,
      content: channel === 'Email'
        ? `Hello {{first_name}},\n\nAs one of our valued VIP members with {{loyalty_points}} loyalty points, we want to invite you to early access of our new collection. Use code **VIPPRIVILEGE** for an exclusive 20% discount.\n\nShop early access: lume.in/vip`
        : `Hello {{first_name}}! 💎 Exclusive VIP Reward: Use code *VIPPRIVILEGE* for 20% off early access arrivals. You have *{{loyalty_points}}* points available! Shop: lume.in/vip`
    }
  ];

  return { variants };
}
