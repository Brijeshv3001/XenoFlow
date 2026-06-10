import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: campaignId } = params;

    const campaign = await db.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Retrieve recent message status logs (limit 150 for performance)
    const messages = await db.message.findMany({
      where: { campaign_id: campaignId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 150
    });

    // Retrieve recent audit events
    const events = await db.campaignEvent.findMany({
      where: {
        message: {
          campaign_id: campaignId
        }
      },
      include: {
        message: {
          include: {
            customer: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    // Calculate real-time stats from messages directly to verify Campaign table aggregates
    const statsCount = await db.message.groupBy({
      by: ['status'],
      where: { campaign_id: campaignId },
      _count: { id: true }
    });

    const counts: any = {
      queued: 0,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      failed: 0
    };

    statsCount.forEach((item) => {
      if (item.status in counts) {
        counts[item.status] = item._count.id;
      }
    });

    // Get segment details
    let segmentName = 'All Customers';
    if (campaign.segment_id) {
      const seg = await db.segment.findUnique({
        where: { id: campaign.segment_id },
        select: { name: true }
      });
      if (seg) segmentName = seg.name;
    }

    return NextResponse.json({
      campaign: {
        ...campaign,
        segmentName
      },
      messages,
      events: events.map(e => ({
        id: e.id,
        messageId: e.message_id,
        customerName: e.message.customer.name,
        eventType: e.event_type,
        timestamp: e.timestamp
      })),
      realtimeCounts: counts
    });

  } catch (error: any) {
    console.error('Error fetching campaign details:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
