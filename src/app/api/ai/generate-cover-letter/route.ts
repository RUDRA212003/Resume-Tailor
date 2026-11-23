import { NextRequest, NextResponse } from 'next/server';
import { generateCoverLetter } from '@/lib/ai/coverLetterEngine';
import { Profile, JobDescription, TailoredResume } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile, jobDescription, tailoredResume, userApprovedSkills } = body as {
      profile: Profile;
      jobDescription: JobDescription;
      tailoredResume?: TailoredResume;
      userApprovedSkills?: string[];
    };

    if (!profile || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing profile or jobDescription parameter.' },
        { status: 400 }
      );
    }

    const coverLetter = await generateCoverLetter(
      profile,
      jobDescription,
      tailoredResume,
      userApprovedSkills || []
    );

    return NextResponse.json(coverLetter);
  } catch (error: any) {
    console.error('Error generating cover letter:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate cover letter.' },
      { status: 500 }
    );
  }
}
