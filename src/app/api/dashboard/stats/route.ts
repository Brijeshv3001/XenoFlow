import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // 1. Core aggregates
    const [totalCustomers, repeatCustomersCount] = await Promise.all([
      db.customer.count(),
      db.customer.count({ where: { order_count: { gte: 2 } } })
    ]);

    const orderAggregates = await db.order.aggregate({
      where: { status: 'completed' },
      _sum: { amount: true },
      _avg: { amount: true },
      _count: { id: true }
    });

    const totalRevenue = orderAggregates._sum.amount || 0;
    const avgOrderValue = orderAggregates._avg.amount || 0;
    const repeatPurchaseRate = totalCustomers > 0 
      ? (repeatCustomersCount / totalCustomers) * 100 
      : 0;

    // 2. Fetch all orders to group by month for sparklines/trends (for the last 6 months)
    const now = new Date("2026-06-09T22:50:43+05:30");
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

    const ordersTrend = await db.order.findMany({
      where: {
        status: 'completed',
        order_date: { gte: sixMonthsAgo }
      },
      select: { amount: true, order_date: true }
    });

    // Group in memory by month-year
    const monthlyGroups: { [key: string]: number } = {};
    ordersTrend.forEach(order => {
      const d = new Date(order.order_date);
      const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyGroups[key] = (monthlyGroups[key] || 0) + order.amount;
    });

    // Format for charts
    const monthlyRevenue = Object.entries(monthlyGroups).map(([month, revenue]) => ({
      month,
      revenue
    })).sort((a, b) => {
      // Sort by date representation
      return new Date(a.month).getTime() - new Date(b.month).getTime();
    });

    // 3. Channel breakdown
    // Group campaigns by channel and sum their sent counts + clicked counts
    const campaignsBreakdown = await db.campaign.findMany({
      select: { channel: true, sent_count: true, clicked_count: true }
    });

    const channelStats: { [key: string]: { sent: number, clicked: number } } = {
      Email: { sent: 0, clicked: 0 },
      WhatsApp: { sent: 0, clicked: 0 },
      SMS: { sent: 0, clicked: 0 },
      RCS: { sent: 0, clicked: 0 }
    };

    campaignsBreakdown.forEach(camp => {
      if (camp.channel in channelStats) {
        channelStats[camp.channel].sent += camp.sent_count;
        channelStats[camp.channel].clicked += camp.clicked_count;
      }
    });

    const channelComparison = Object.entries(channelStats).map(([channel, stats]) => ({
      channel,
      sent: stats.sent,
      clicked: stats.clicked,
      clickRate: stats.sent > 0 ? (stats.clicked / stats.sent) * 100 : 0
    }));

    // 4. Recent activity feed (latest 5 orders & latest 5 callback audit events)
    const recentOrders = await db.order.findMany({
      take: 5,
      orderBy: { order_date: 'desc' },
      include: {
        customer: {
          select: { name: true, email: true }
        }
      }
    });

    const recentEvents = await db.campaignEvent.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' },
      include: {
        message: {
          include: {
            customer: { select: { name: true } },
            campaign: { select: { name: true } }
          }
        }
      }
    });

    const formattedEvents = recentEvents.map(e => ({
      id: e.id,
      customerName: e.message.customer.name,
      campaignName: e.message.campaign.name,
      eventType: e.event_type,
      timestamp: e.timestamp
    }));

    return NextResponse.json({
      aggregates: {
        totalCustomers,
        totalRevenue,
        avgOrderValue,
        repeatPurchaseRate
      },
      monthlyRevenue,
      channelComparison,
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        customerName: o.customer.name,
        amount: o.amount,
        productName: o.product_name,
        orderDate: o.order_date
      })),
      recentEvents: formattedEvents
    });

  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
