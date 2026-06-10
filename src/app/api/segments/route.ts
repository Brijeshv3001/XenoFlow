import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildPrismaWhereClause, SegmentRule } from '@/lib/segmentEvaluator';

export async function GET() {
  try {
    const segments = await db.segment.findMany({
      orderBy: { created_at: 'desc' }
    });
    return NextResponse.json(segments);
  } catch (error: any) {
    console.error('Error fetching segments:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name, description, rules } = await req.json();

    if (!name || !rules || !Array.isArray(rules)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Missing name or rules array' },
        { status: 400 }
      );
    }

    // Evaluate matching customer count
    const where = buildPrismaWhereClause(rules as SegmentRule[]);
    const count = await db.customer.count({ where });

    // Save segment
    const segment = await db.segment.create({
      data: {
        name,
        description: description || '',
        rules_json: JSON.stringify(rules),
        customer_count: count
      }
    });

    return NextResponse.json(segment);

  } catch (error: any) {
    console.error('Error creating segment:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
