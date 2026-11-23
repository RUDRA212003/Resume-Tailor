import { NextRequest, NextResponse } from 'next/server';
import { generateTailoredResume } from '@/lib/ai/tailorEngine';
import { scanResumeForAts } from '@/lib/ai/atsScanner';
import { Profile, JobDescription, JDAnalysis, ResumeTemplate, TailoredResume } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      profile,
      jobDescription,
      analysis,
      template,
      userApprovedSkills,
      existingResume,
    } = body as {
      profile: Profile;
      jobDescription: JobDescription;
      analysis: JDAnalysis;
      template: ResumeTemplate;
      userApprovedSkills?: string[];
      existingResume?: TailoredResume;
    };

    if (!profile || !jobDescription || !template) {
      return NextResponse.json(
        { error: 'Missing required parameters for refinement (profile, jobDescription, template).' },
        { status: 400 }
      );
    }

    const approvedSkills = userApprovedSkills || [];

    const finalAnalysis: JDAnalysis = analysis || {
      relevanceScore: 85,
      requiredSkills: approvedSkills.map((s) => ({
        name: s,
        status: 'available',
        category: 'technical',
        confidence: 0.9,
        evidenceInProfile: [s],
      })),
      preferredSkills: [],
      missingSkills: [],
      recommendations: [],
      scoreBreakdown: {
        skillsMatchPercentage: 85,
        experienceRelevance: 85,
        projectRelevance: 85,
        keywordCoverage: 85,
        explanation: 'Synthesized for refinement.',
      },
    };

    // Run tailor engine in refinement mode
    const refined = await generateTailoredResume(
      profile,
      jobDescription,
      finalAnalysis,
      template,
      approvedSkills,
      true // isRefinement: true
    );

    // Keep same ID if existing resume provided
    if (existingResume?.id) {
      refined.id = existingResume.id;
    }

    // Run ATS scan on the refined resume
    const atsReport = scanResumeForAts(refined, jobDescription, approvedSkills);

    return NextResponse.json({
      refinedResume: refined,
      atsReport,
    });
  } catch (error: any) {
    console.error('Error refining resume:', error);
    return NextResponse.json(
      { error: error.message || 'Refinement failed' },
      { status: 500 }
    );
  }
}
