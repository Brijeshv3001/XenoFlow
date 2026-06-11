import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/claude";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    const hasKey = process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "mock-key";
    if (!hasKey) {
      // Rule translation regex-based fallback
      const rules = [];
      const lower = prompt.toLowerCase();
      
      if (lower.includes("mumbai")) rules.push({ field: "city", op: "eq", value: "Mumbai" });
      if (lower.includes("delhi")) rules.push({ field: "city", op: "eq", value: "Delhi" });
      if (lower.includes("bangalore")) rules.push({ field: "city", op: "eq", value: "Bangalore" });
      
      const spentMatch = lower.match(/(?:spent|spent over|spent more than|spent >) (\d+)/);
      if (spentMatch) {
        rules.push({ field: "total_spent", op: "gte", value: parseInt(spentMatch[1], 10) });
      }
      
      const orderMatch = lower.match(/(?:orders|orders over|orders more than|orders >) (\d+)/);
      if (orderMatch) {
        rules.push({ field: "order_count", op: "gte", value: parseInt(orderMatch[1], 10) });
      }

      if (rules.length === 0) {
        rules.push({ field: "total_spent", op: "gte", value: 1000 });
      }
      return NextResponse.json({ success: true, rules });
    }

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 400,
      messages: [{
        role: "user",
        content: `Convert this customer filter description into JSON segment rules for a fashion brand CRM.

Description: "${prompt}"

Available fields and operators:
- total_spent (gt/gte/lt/lte) — in rupees
- order_count (gt/gte/lt/lte/eq)
- last_order_days_ago (gt/gte/lt/lte) — days since last order
- avg_order_value (gt/gte/lt/lte)
- rfm_recency, rfm_frequency, rfm_monetary (gt/gte/lt/lte) — scores 1-5
- city (eq) — city name
- signup_days_ago (gt/gte/lt/lte)

Return ONLY valid JSON array of rules. Example:
[{"field":"total_spent","op":"gte","value":5000},{"field":"last_order_days_ago","op":"lte","value":30}]`
      }],
    });

    const text = (response.content[0] as any).text.trim();
    const cleanText = text.substring(text.indexOf("["), text.lastIndexOf("]") + 1);
    const rules = JSON.parse(cleanText);
    return NextResponse.json({ success: true, rules });
  } catch (err: any) {
    console.error("AI Segment translation error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
