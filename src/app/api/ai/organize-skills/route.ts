import { NextRequest, NextResponse } from 'next/server';
import { parseAndCategorizeSkillsText } from '@/lib/ai/resumeParser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body?.text || '';

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Please provide skills text to organize.' },
        { status: 400 }
      );
    }

    const skills = parseAndCategorizeSkillsText(text);

    return NextResponse.json({
      success: true,
      skills,
      count: skills.length,
    });
  } catch (error: any) {
    console.error('Error organizing skills:', error);
    return NextResponse.json(
      { error: 'Failed to organize skills: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
