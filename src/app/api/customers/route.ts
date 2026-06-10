import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const city = searchParams.get('city') || '';
    const tag = searchParams.get('tag') || '';
    const rfm = searchParams.get('rfm') || '';
    const minSpent = searchParams.get('minSpent') ? parseFloat(searchParams.get('minSpent')!) : null;
    const maxDays = searchParams.get('maxDays') ? parseInt(searchParams.get('maxDays')!) : null;
    
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } }
      ];
    }

    if (city) {
      where.city = city;
    }

    if (tag) {
      where.tags = { contains: tag };
    }

    if (rfm) {
      where.rfm_score = rfm;
    }

    if (minSpent !== null) {
      where.total_spent = { gte: minSpent };
    }

    if (maxDays !== null) {
      const now = new Date("2026-06-09T22:50:43+05:30");
      const refDate = new Date(now.getTime() - maxDays * 24 * 60 * 60 * 1000);
      where.last_order_date = { gte: refDate };
    }

    // Run database queries
    const [customers, totalCount] = await Promise.all([
      db.customer.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { signup_date: 'desc' },
        include: { orders: true }
      }),
      db.customer.count({ where })
    ]);

    // Calculate overall stats for the current filtered list
    const stats = await db.customer.aggregate({
      where,
      _sum: { total_spent: true },
      _avg: { total_spent: true },
      _count: { id: true }
    });

    return NextResponse.json({
      customers,
      totalCount,
      stats: {
        totalRevenue: stats._sum.total_spent || 0,
        avgLifetimeValue: stats._avg.total_spent || 0,
        count: stats._count.id || 0
      }
    });

  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { customers } = await req.json();

    if (!customers || !Array.isArray(customers)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Missing or invalid customers list' },
        { status: 400 }
      );
    }

    let importedCount = 0;
    const now = new Date("2026-06-09T22:50:43+05:30");

    for (const item of customers) {
      const { name, email, phone, city, tags, total_spent, order_count } = item;

      if (!name || !email) continue;

      const parsedTags = Array.isArray(tags) 
        ? tags 
        : typeof tags === 'string' 
          ? tags.startsWith('[') ? JSON.parse(tags) : [tags]
          : [];

      if (parsedTags.length === 0) {
        parsedTags.push("imported");
      }

      const spent = total_spent ? parseFloat(total_spent) : 0;
      const count = order_count ? parseInt(order_count, 10) : 0;

      // Check if user exists
      await db.customer.upsert({
        where: { email },
        update: {
          name,
          phone: phone || '',
          city: city || 'Unknown',
          total_spent: spent,
          order_count: count,
          tags: JSON.stringify(parsedTags),
          rfm_score: spent > 15000 ? "333" : "222"
        },
        create: {
          name,
          email,
          phone: phone || '',
          city: city || 'Unknown',
          signup_date: now,
          total_spent: spent,
          order_count: count,
          tags: JSON.stringify(parsedTags),
          rfm_score: spent > 15000 ? "333" : "222"
        }
      });

      importedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedCount} customers.`,
      count: importedCount
    });

  } catch (error: any) {
    console.error('Error importing customers:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
