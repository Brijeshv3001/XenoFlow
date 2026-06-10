import { NextResponse } from 'next/server';
import { generate_message_variants } from '@/lib/toolHandlers';
import { askClaude } from '@/lib/claude';

export async function POST(req: Request) {
  try {
    const { goal, channel, tone } = await req.json();

    if (!goal || !channel) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Missing goal or channel' },
        { status: 400 }
      );
    }

    log(`AI copywriter requested for goal: "${goal}" channel: "${channel}" tone: "${tone || 'default'}"`);

    const result = await generate_message_variants(goal, channel, tone);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error generating AI drafts:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}

function log(msg: string) {
  console.log(`[API/Campaigns/AI-Draft] ${msg}`);
}
