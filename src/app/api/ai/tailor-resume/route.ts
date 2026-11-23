import { NextRequest, NextResponse } from 'next/server';
import { generateTailoredResume } from '@/lib/ai/tailorEngine';
import { Profile, JobDescription, JDAnalysis, ResumeTemplate } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile, jobDescription, analysis, template, userApprovedSkills } = body as {
      profile: Profile;
      jobDescription: JobDescription;
      analysis: JDAnalysis;
      template: ResumeTemplate;
      userApprovedSkills?: string[];
    };

    if (!profile || !jobDescription || !analysis || !template) {
      return NextResponse.json(
        { error: 'Missing required parameters (profile, jobDescription, analysis, template).' },
        { status: 400 }
      );
    }

    const tailored = await generateTailoredResume(
      profile,
      jobDescription,
      analysis,
      template,
      userApprovedSkills || []
    );
    return NextResponse.json(tailored);
  } catch (error) {
    console.error('Error generating tailored resume:', error);
    return NextResponse.json(
      { error: 'Failed to generate tailored resume. Please try again.' },
      { status: 500 }
    );
  }
}
