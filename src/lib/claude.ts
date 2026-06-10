import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;

export const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

// Mock response database for local testing without Anthropic API Key
export async function getMockChatResponse(messages: any[]) {
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
  
  let text = '';
  let toolUse: any = null;

  if (lastMessage.includes('vip') || lastMessage.includes('high spent') || lastMessage.includes('top spenders')) {
    toolUse = {
      name: 'query_customers',
      id: `tool_${Math.random().toString(36).substr(2, 9)}`,
      input: { filters: { min_spent: 15000 } }
    };
    text = `I have queried our database for VIP customers who have spent over ₹15,000. I found matching high-value shoppers. Would you like me to save this as a new segment or draft a campaign for them?`;
  } else if (lastMessage.includes('at-risk') || lastMessage.includes('churn') || lastMessage.includes('haven\'t purchased')) {
    toolUse = {
      name: 'query_customers',
      id: `tool_${Math.random().toString(36).substr(2, 9)}`,
      input: { filters: { max_days_since_order: 60 } }
    };
    text = `I've analyzed our customer database for at-risk shoppers (who haven't purchased in the last 60 days). We have some shoppers in this segment. Retargeting them with a win-back discount would be a great next step.`;
  } else if (lastMessage.includes('campaign') && lastMessage.includes('performance') || lastMessage.includes('best') || lastMessage.includes('stats')) {
    toolUse = {
      name: 'get_campaign_stats',
      id: `tool_${Math.random().toString(36).substr(2, 9)}`,
      input: {}
    };
    text = `I've retrieved our campaign statistics. The **VIP Early Access** WhatsApp campaign performed exceptionally well last quarter, with a click rate of 50.6% and contributing ₹62,499 in attributed revenue.`;
  } else if (lastMessage.includes('draft') || lastMessage.includes('write') || lastMessage.includes('message')) {
    toolUse = {
      name: 'generate_message_variants',
      id: `tool_${Math.random().toString(36).substr(2, 9)}`,
      input: {
        goal: lastMessage,
        channel: lastMessage.includes('whatsapp') ? 'WhatsApp' : 'Email',
        tone: 'exclusive',
        personalization_tokens: ['first_name', 'last_order_date']
      }
    };
    text = `I've generated 3 campaign copy variants. You can review them and load them directly into your campaign builder!`;
  } else {
    text = `Hi there! I am Xeno AI, your marketing assistant. I can help you query customer lists, save segments, inspect campaign performance, draft messages, and launch campaigns. Try asking:
- "Who are my top VIP customers?"
- "Which campaign performed best?"
- "Draft a win-back message for at-risk VIPs"`;
  }

  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 1200));

  return {
    content: text,
    toolUse
  };
}

export async function askClaude(prompt: string, systemPrompt?: string): Promise<string> {
  if (!anthropic) {
    // Basic mock logic for natural language segmentation
    if (prompt.toLowerCase().includes('mumbai')) {
      return JSON.stringify([
        { field: 'city', operator: 'eq', value: 'Mumbai' },
        { field: 'total_spent', operator: 'gt', value: 3000 }
      ]);
    }
    if (prompt.toLowerCase().includes('vip')) {
      return JSON.stringify([
        { field: 'tags', operator: 'contains', value: 'VIP' }
      ]);
    }
    if (prompt.toLowerCase().includes('at-risk') || prompt.toLowerCase().includes('haven\'t returned')) {
      return JSON.stringify([
        { field: 'last_purchase_days', operator: 'gt', value: 60 }
      ]);
    }
    return JSON.stringify([
      { field: 'order_count', operator: 'gt', value: 1 }
    ]);
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    });

    const block = response.content[0];
    if (block.type === 'text') {
      return block.text.trim();
    }
    return '';
  } catch (error) {
    console.error('Claude API call error:', error);
    throw error;
  }
}
