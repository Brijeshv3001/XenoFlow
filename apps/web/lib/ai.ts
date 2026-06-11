import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY || '';

export const anthropic = apiKey
  ? new Anthropic({ apiKey })
  : null;

if (!anthropic) {
  console.warn(
    '⚠️ ANTHROPIC_API_KEY is not defined in the environment. AI features will run in mock mode.'
  );
}

// System prompt for Claude tool calls
export const SYSTEM_PROMPT = `You are Xeno AI, a marketing intelligence assistant for the Lumé fashion brand CRM. 
You help marketers make smart decisions about who to reach, what to say, and when. 
You have access to real customer data via tools and can take actions. 
Always confirm before sending campaigns. 
Be concise, data-driven, and proactive about suggesting opportunities.
Current date/time: June 11, 2026.`;
