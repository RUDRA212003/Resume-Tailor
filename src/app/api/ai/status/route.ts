import { NextResponse } from 'next/server';
import { getGeminiClient, getResolvedModel } from '@/lib/ai/geminiClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  const gemini = getGeminiClient();
  const model = getResolvedModel();

  if (!gemini) {
    return NextResponse.json({
      configured: false,
      engine: 'heuristic-fallback',
      label: 'Local Engine (No API Key)',
      model: null,
    });
  }

  return NextResponse.json({
    configured: true,
    engine: 'gemini-api',
    label: `Gemini AI Active (${model})`,
    model,
  });
}
