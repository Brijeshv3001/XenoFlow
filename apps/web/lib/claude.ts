import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "mock-key",
});

export const AI_SYSTEM_PROMPT = `
You are Xeno AI — a smart marketing intelligence assistant for Lumé, a D2C fashion
brand CRM. You help marketers find the right customers, craft compelling messages,
and run high-performing campaigns.

You have access to live customer data and can take real actions via tools.
Always confirm before sending a campaign. Be concise, data-driven, and proactive.

Brand context: Lumé is a premium Indian fashion brand. Typical products: kurtas,
dresses, blazers, accessories. Price range ₹500–₹8000. Main cities: Mumbai, Delhi,
Bangalore, Hyderabad, Chennai.

When you use a tool, briefly explain what you found before continuing.
`;

export const AI_TOOLS: Anthropic.Tool[] = [
  {
    name: "query_customers",
    description: "Query and filter customers from the database. Use this to find specific customer groups.",
    input_schema: {
      type: "object" as const,
      properties: {
        min_spent:             { type: "number", description: "Minimum total spent (₹)" },
        max_spent:             { type: "number", description: "Maximum total spent (₹)" },
        min_orders:            { type: "number", description: "Minimum number of orders" },
        max_orders:            { type: "number", description: "Maximum number of orders" },
        min_days_since_order:  { type: "number", description: "Min days since last order" },
        max_days_since_order:  { type: "number", description: "Max days since last order" },
        city:                  { type: "string", description: "Filter by city" },
        tag:                   { type: "string", description: "Filter by tag: vip, loyal, at_risk, new, one_time, seasonal" },
        limit:                 { type: "number", description: "Max results to return (default 10)" },
      },
    },
  },
  {
    name: "create_segment",
    description: "Save a customer segment with a name and filter rules.",
    input_schema: {
      type: "object" as const,
      required: ["name", "rules"],
      properties: {
        name:        { type: "string" },
        description: { type: "string" },
        rules: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: { type: "string" },
              op:    { type: "string", enum: ["gt","gte","lt","lte","eq","neq"] },
              value: { },
            },
          },
        },
      },
    },
  },
  {
    name: "get_campaign_stats",
    description: "Get performance metrics for one campaign or all campaigns.",
    input_schema: {
      type: "object" as const,
      properties: {
        campaign_id: { type: "string", description: "Specific campaign ID, or omit for all" },
      },
    },
  },
  {
    name: "create_campaign",
    description: "Create a new campaign. Set send_now=true to dispatch immediately.",
    input_schema: {
      type: "object" as const,
      required: ["name", "segment_id", "channel", "message_template"],
      properties: {
        name:             { type: "string" },
        segment_id:       { type: "string" },
        channel:          { type: "string", enum: ["whatsapp","sms","email","rcs"] },
        message_template: { type: "string" },
        subject_line:     { type: "string" },
        send_now:         { type: "boolean", default: false },
      },
    },
  },
  {
    name: "generate_message_variants",
    description: "Generate 3 message copy variants for a campaign goal.",
    input_schema: {
      type: "object" as const,
      required: ["goal", "channel"],
      properties: {
        goal:    { type: "string", description: "What the campaign wants to achieve" },
        channel: { type: "string", enum: ["whatsapp","sms","email","rcs"] },
        tone:    { type: "string", enum: ["friendly","urgent","exclusive","playful"] },
      },
    },
  },
  {
    name: "list_segments",
    description: "List all existing segments with their customer counts.",
    input_schema: { type: "object" as const, properties: {} },
  },
];
