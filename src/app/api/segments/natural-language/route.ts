import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildPrismaWhereClause, SegmentRule } from '@/lib/segmentEvaluator';
import { askClaude } from '@/lib/claude';

const SYSTEM_PROMPT = `You are a rule extraction bot. Convert a user's natural language description of a customer segment into a JSON array of segment rule objects.

Each rule object in the array MUST follow this exact schema:
{
  "field": "total_spent" | "order_count" | "city" | "tags" | "last_purchase_days" | "signup_days",
  "operator": "gt" | "lt" | "eq" | "neq" | "contains" | "lte",
  "value": string | number
}

Rules Mapping Guide:
- "spent over ₹X", "spent more than X", "total spent > X" -> field: "total_spent", operator: "gt", value: X
- "spent less than X" -> field: "total_spent", operator: "lt", value: X
- "bought X times", "order count > X" -> field: "order_count", operator: "gt" (or "eq" or "lt" depending on language), value: X
- "living in Mumbai", "city is Delhi" -> field: "city", operator: "eq", value: "Mumbai" / "Delhi"
- "VIP segment", "has tag VIP" -> field: "tags", operator: "contains", value: "VIP"
- "purchased in the last 30 days" -> field: "last_purchase_days", operator: "lt", value: 30
- "haven't purchased in 60 days", "no purchase for 90 days" -> field: "last_purchase_days", operator: "gt", value: 60 / 90
- "signed up in the last 30 days" -> field: "signup_days", operator: "lte", value: 30

Return ONLY the JSON array. Do NOT wrap it in markdown code blocks or add any conversational text. Example output:
[{"field":"city","operator":"eq","value":"Mumbai"},{"field":"total_spent","operator":"gt","value":5000}]`;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Missing prompt text' },
        { status: 400 }
      );
    }

    log(`NL Segment prompt received: "${prompt}"`);

    // Call Claude
    const responseText = await askClaude(prompt, SYSTEM_PROMPT);
    log(`Claude NL Segment output: ${responseText}`);

    let rules: SegmentRule[] = [];
    try {
      // Strip markdown code blocks if AI accidentally included them
      let cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      rules = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Failed to parse AI response as JSON:', responseText, parseErr);
      return NextResponse.json(
        { error: 'AI Error', message: 'Could not parse AI response as query rules. Please try again.' },
        { status: 500 }
      );
    }

    // Validate rules shape
    if (!Array.isArray(rules)) {
      return NextResponse.json(
        { error: 'AI Error', message: 'AI returned an invalid rule format' },
        { status: 500 }
      );
    }

    // Execute queries
    const where = buildPrismaWhereClause(rules);
    const customers = await db.customer.findMany({
      where,
      take: 100, // Limit for preview speed
      orderBy: { total_spent: 'desc' }
    });

    const count = await db.customer.count({ where });

    return NextResponse.json({
      rules,
      count,
      customers
    });

  } catch (error: any) {
    console.error('Error in NL segmentation:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}

function log(msg: string) {
  console.log(`[API/Segments/NL] ${msg}`);
}
