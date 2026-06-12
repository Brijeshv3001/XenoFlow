import { NextRequest, NextResponse } from "next/server";
import { anthropic, AI_SYSTEM_PROMPT, AI_TOOLS } from "@/lib/claude";
import { getDb, getAllCampaigns, createCampaign, createSegment, previewSegment, rulesToSQL } from "@xeno/db";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const toolCallsMade: { name: string; input: any; result: any }[] = [];

    // Bulletproof Fallback: Run mock response logic if API key is missing
    const hasKey = process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "mock-key";
    if (!hasKey) {
      const lastUserMsg = messages[messages.length - 1]?.content;
      let replyText = "Hi! I'm Xeno AI in mock developer mode. Please supply ANTHROPIC_API_KEY to enable full Claude reasoning.";
      
      // Handle simple requests with mock tool execution
      if (lastUserMsg?.toLowerCase().includes("customer") || lastUserMsg?.toLowerCase().includes("spent")) {
        const result = await executeTool("query_customers", { limit: 5 });
        toolCallsMade.push({ name: "query_customers", input: { limit: 5 }, result });
        replyText = `I have queried the shoppers list and found ${result.count} customers in Lumé database. Here are some top spent customers.`;
      } else if (lastUserMsg?.toLowerCase().includes("segment")) {
        const result = await executeTool("list_segments", {});
        toolCallsMade.push({ name: "list_segments", input: {}, result });
        replyText = `Lumé currently has ${result.length} active customer segments configured.`;
      } else if (lastUserMsg?.toLowerCase().includes("campaign")) {
        const result = await executeTool("get_campaign_stats", {});
        toolCallsMade.push({ name: "get_campaign_stats", input: {}, result });
        replyText = `Lumé has campaign data. Recent campaign stats are shown below.`;
      }
      
      return NextResponse.json({ reply: replyText, toolCalls: toolCallsMade });
    }

    let currentMessages = [...messages];

    // Agentic loop (max 5 iterations to prevent runaway)
    for (let i = 0; i < 5; i++) {
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: AI_SYSTEM_PROMPT,
        tools: AI_TOOLS,
        messages: currentMessages.map(m => ({
          role: m.role,
          content: m.content
        })),
      });

      if (response.stop_reason === "end_turn") {
        const text = response.content
          .filter(b => b.type === "text")
          .map(b => (b as any).text)
          .join("");
        return NextResponse.json({ reply: text, toolCalls: toolCallsMade });
      }

      if (response.stop_reason === "tool_use") {
        const toolUseBlocks = response.content.filter(b => b.type === "tool_use");
        const toolResults = [];

        for (const block of toolUseBlocks as any[]) {
          const result = await executeTool(block.name, block.input);
          toolCallsMade.push({ name: block.name, input: block.input, result });
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        }

        // Append assistant turn + tool results
        currentMessages = [
          ...currentMessages,
          { role: "assistant", content: response.content as any },
          { role: "user", content: toolResults as any },
        ];
      }
    }

    return NextResponse.json({ reply: "I hit my loop iteration limit. Please refine your query.", toolCalls: toolCallsMade });
  } catch (err: any) {
    console.error("AI Chat API error:", err);
    return NextResponse.json({ reply: `An error occurred: ${err.message}`, toolCalls: [] }, { status: 500 });
  }
}

async function executeTool(name: string, input: any) {
  const db = getDb();
  switch (name) {
    case "query_customers": {
      const conditions: string[] = [];
      if (input.min_spent)            conditions.push(`total_spent >= ${input.min_spent}`);
      if (input.max_spent)            conditions.push(`total_spent <= ${input.max_spent}`);
      if (input.min_orders)           conditions.push(`order_count >= ${input.min_orders}`);
      if (input.max_orders)           conditions.push(`order_count <= ${input.max_orders}`);
      if (input.min_days_since_order) conditions.push(`EXTRACT(DAY FROM NOW() - last_order_date) >= ${input.min_days_since_order}`);
      if (input.max_days_since_order) conditions.push(`EXTRACT(DAY FROM NOW() - last_order_date) <= ${input.max_days_since_order}`);
      if (input.city)                 conditions.push(`city = '${input.city.replace(/'/g, "''")}'`);
      if (input.tag)                  conditions.push(`tags LIKE '%${input.tag.replace(/'/g, "''")}%'`);
      const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
      const limit = Math.min(input.limit ?? 10, 50);
      const res = await db.query(
        `SELECT id, name, email, city, total_spent, order_count, last_order_date, tags
         FROM customers ${where} ORDER BY total_spent DESC LIMIT ${limit}`
      );
      const countRes = await db.query(`SELECT COUNT(*) FROM customers ${where}`);
      return { 
        count: parseInt(countRes.rows[0].count, 10), 
        sample: res.rows.map(r => ({ ...r, total_spent: Number(r.total_spent) })) 
      };
    }
    case "create_segment":
      return await createSegment({ ...input, is_ai_generated: true });
    case "get_campaign_stats": {
      if (input.campaign_id) {
        const res = await db.query("SELECT * FROM campaigns WHERE id = $1", [input.campaign_id]);
        return res.rows[0] ?? { error: "Campaign not found" };
      }
      const res = await db.query("SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 10");
      return res.rows;
    }
    case "create_campaign":
      return await createCampaign(input);
    case "list_segments": {
      const res = await db.query("SELECT id, name, description, customer_count FROM segments ORDER BY customer_count DESC");
      return res.rows;
    }
    case "generate_message_variants": {
      const mockKey = !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "mock-key";
      if (mockKey) {
        return [
          { variant: 1, tone: input.tone || "exclusive", subject: "Lumé VIP Exclusive Offer", message: "Hey {{first_name}}, check out our new kurtas!" },
          { variant: 2, tone: "friendly", subject: "New arrivals at Lumé", message: "Hi {{first_name}}, treat yourself today!" },
          { variant: 3, tone: "urgent", subject: "Hurry, Lumé stock is low", message: "Dear {{first_name}}, get 15% off before tonight!" }
        ];
      }
      
      const varRes = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 800,
        messages: [{
          role: "user",
          content: `Generate 3 ${input.channel} message variants for Lumé fashion brand.
Goal: ${input.goal}
Tone: ${input.tone ?? "friendly"}
Channel constraints: ${input.channel === "sms" ? "max 160 chars" : input.channel === "whatsapp" ? "max 500 chars, can use emojis" : "no limit"}
Use {{first_name}} for personalization.
Return JSON array: [{ "variant": 1, "tone": "...", "message": "...", "subject": "..." }]
Only JSON, no markdown.`
        }],
      });
      try {
        const text = (varRes.content[0] as any).text;
        return JSON.parse(text);
      } catch { 
        return []; 
      }
    }
    default:
      return { error: "Unknown tool" };
  }
}
