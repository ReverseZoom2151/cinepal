import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateAIResponse } from '../../../lib/ai';

export async function POST(request: NextRequest) {
  const { message } = await request.json();

  const reply = await generateAIResponse(message);

  return NextResponse.json({ reply });
}
