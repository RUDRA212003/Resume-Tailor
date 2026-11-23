import { NextRequest, NextResponse } from 'next/server';
import { analyzeJobDescription } from '@/lib/ai/jdAnalyzer';
import { JobDescription, Profile } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobDescription, profile } = body as {
      jobDescription: JobDescription;
      profile: Profile;
    };

    if (!jobDescription || !jobDescription.rawText) {
      return NextResponse.json(
        { error: 'Job description text is required.' },
        { status: 400 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Candidate profile is required.' },
        { status: 400 }
      );
    }

    const analysis = await analyzeJobDescription(jobDescription, profile);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing job description:', error);
    return NextResponse.json(
      { error: 'Failed to analyze job description. Please try again.' },
      { status: 500 }
    );
  }
}
