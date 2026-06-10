import { NextResponse } from 'next/server';
import { anthropic, getMockChatResponse } from '@/lib/claude';
import * as handlers from '@/lib/toolHandlers';

const SYSTEM_PROMPT = `You are Xeno AI, a marketing intelligence assistant for the Lumé fashion brand CRM. You help marketers make smart decisions about who to reach, what to say, and when. You have access to real customer data and can take actions. Always confirm before sending campaigns. Be concise, data-driven, and proactive about suggesting opportunities.
You can query customers, inspect campaign statistics, save segments, write message copy, and dispatch campaigns using your tools. Always present data clearly, using bold text, tables, or lists where appropriate.`;

// Anthropic tools schema definition
const TOOLS = [
  {
    name: 'query_customers',
    description: 'Query customers with filters to find counts or sample customers.',
    input_schema: {
      type: 'object',
      properties: {
        filters: {
          type: 'object',
          properties: {
            rfm_score: { type: 'string', description: 'RFM score code e.g. "333", "111"' },
            city: { type: 'string', description: 'City name e.g. "Mumbai", "Delhi"' },
            tags: { type: 'string', description: 'Tag containing value e.g. "VIP", "loyal", "at-risk", "new"' },
            min_spent: { type: 'number', description: 'Minimum lifetime amount spent in INR' },
            max_days_since_order: { type: 'number', description: 'Max days since their last order' },
            order_count_min: { type: 'number', description: 'Minimum number of orders placed' }
          }
        }
      }
    }
  },
  {
    name: 'create_segment',
    description: 'Save a customer segment with rules in the database.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the segment e.g. "Mumbai Spenders"' },
        description: { type: 'string', description: 'Brief description of segment' },
        rules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string', enum: ['total_spent', 'order_count', 'city', 'tags', 'last_purchase_days', 'signup_days'] },
              operator: { type: 'string', enum: ['gt', 'lt', 'eq', 'neq', 'contains', 'lte'] },
              value: { type: 'string' }
            },
            required: ['field', 'operator', 'value']
          }
        }
      },
      required: ['name', 'rules']
    }
  },
  {
    name: 'get_campaign_stats',
    description: 'Get performance metrics for a specific campaign or all campaigns.',
    input_schema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'Optional Campaign UUID' }
      }
    }
  },
  {
    name: 'create_campaign',
    description: 'Create and optionally send/schedule a campaign.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the campaign' },
        segment_id: { type: 'string', description: 'Target Segment ID' },
        channel: { type: 'string', enum: ['WhatsApp', 'SMS', 'Email', 'RCS'] },
        message: { type: 'string', description: 'Message body template with optional {{first_name}} and {{loyalty_points}}' },
        send_now: { type: 'boolean', description: 'Set true to send immediately, false to save as draft' }
      },
      required: ['name', 'segment_id', 'channel', 'message', 'send_now']
    }
  },
  {
    name: 'generate_message_variants',
    description: 'Generate 3 message variants for a marketing goal.',
    input_schema: {
      type: 'object',
      properties: {
        goal: { type: 'string', description: 'Marketing campaign goal e.g. "win-back VIP churners"' },
        channel: { type: 'string', enum: ['WhatsApp', 'SMS', 'Email', 'RCS'] },
        tone: { type: 'string', description: 'Tone of the copy' }
      },
      required: ['goal', 'channel']
    }
  }
];

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Missing messages history' },
        { status: 400 }
      );
    }

    // 1. Fallback to mock AI if Anthropic API key is not configured
    if (!anthropic) {
      log('No Anthropic API Key. Running in Mock AI mode.');
      const mockResult = await getMockChatResponse(messages);
      
      const responsePayload: any = {
        message: {
          role: 'assistant',
          content: mockResult.content
        }
      };

      if (mockResult.toolUse) {
        responsePayload.toolCalls = [
          {
            id: mockResult.toolUse.id,
            name: mockResult.toolUse.name,
            input: mockResult.toolUse.input,
            output: mockResult.toolUse.name === 'query_customers' 
              ? { count: 87, sampleCustomers: [] } 
              : mockResult.toolUse.name === 'get_campaign_stats'
              ? { campaigns: [] }
              : { success: true }
          }
        ];
      }

      return NextResponse.json(responsePayload);
    }

    // 2. Call Claude API with Tools Schema
    log(`Calling Claude model with ${messages.length} conversation messages...`);
    
    // Format message history for Anthropic structure (user and assistant roles)
    const formattedMessages = messages.map(m => ({
      role: m.role === 'user' ? 'user' as const : 'assistant' as const,
      content: m.content
    }));

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: formattedMessages
    });

    const assistantContentBlock = response.content;
    let textResponse = '';
    const toolCalls: any[] = [];

    // Parse Response blocks
    for (const block of assistantContentBlock) {
      if (block.type === 'text') {
        textResponse += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: block.input
        });
      }
    }

    // 3. Process tool calls if requested by Claude
    if (toolCalls.length > 0) {
      const toolCallLogs: any[] = [];
      const toolResponseMessagesContent: any[] = [];

      for (const call of toolCalls) {
        let result: any = null;
        log(`AI requested tool execution: ${call.name} with input ${JSON.stringify(call.input)}`);
        
        try {
          if (call.name === 'query_customers') {
            result = await handlers.query_customers(call.input.filters || {});
          } else if (call.name === 'create_segment') {
            result = await handlers.create_segment(call.input.name, call.input.description, call.input.rules);
          } else if (call.name === 'get_campaign_stats') {
            result = await handlers.get_campaign_stats(call.input.campaign_id);
          } else if (call.name === 'create_campaign') {
            result = await handlers.create_campaign(
              call.input.name,
              call.input.segment_id,
              call.input.channel,
              call.input.message,
              call.input.send_now
            );
          } else if (call.name === 'generate_message_variants') {
            result = await handlers.generate_message_variants(
              call.input.goal,
              call.input.channel,
              call.input.tone
            );
          } else {
            result = { error: 'Unknown tool' };
          }
        } catch (err: any) {
          console.error(`Error executing tool ${call.name}:`, err);
          result = { error: 'Execution error', message: err.message };
        }

        toolCallLogs.push({
          id: call.id,
          name: call.name,
          input: call.input,
          output: result
        });

        // Construct tool response block
        toolResponseMessagesContent.push({
          type: 'tool_result',
          tool_use_id: call.id,
          content: JSON.stringify(result)
        });
      }

      // Feed tool results back to Claude to complete the conversation
      log(`Feeding tool responses back to Claude...`);
      
      const followUpMessages = [
        ...formattedMessages,
        {
          role: 'assistant' as const,
          content: assistantContentBlock
        },
        {
          role: 'user' as const,
          content: toolResponseMessagesContent
        }
      ];

      const secondResponse = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: followUpMessages
      });

      const secondBlock = secondResponse.content[0];
      if (secondBlock.type === 'text') {
        textResponse = secondBlock.text;
      }

      return NextResponse.json({
        message: {
          role: 'assistant',
          content: textResponse
        },
        toolCalls: toolCallLogs
      });
    }

    // Return direct text response if no tools were called
    return NextResponse.json({
      message: {
        role: 'assistant',
        content: textResponse
      }
    });

  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}

function log(msg: string) {
  console.log(`[API/Chat] ${msg}`);
}
