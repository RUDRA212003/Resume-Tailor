import { NextRequest, NextResponse } from 'next/server';
import { scanResumeForAts } from '@/lib/ai/atsScanner';
import { TailoredResume, JobDescription } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resume, jobDescription, userApprovedSkills } = body as {
      resume: TailoredResume;
      jobDescription: JobDescription;
      userApprovedSkills?: string[];
    };

    if (!resume || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing resume or job description parameters' },
        { status: 400 }
      );
    }

    const report = scanResumeForAts(resume, jobDescription, userApprovedSkills || []);
    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Error scanning resume for ATS:', error);
    return NextResponse.json(
      { error: error.message || 'ATS scan failed' },
      { status: 500 }
    );
  }
}
