import { NextRequest, NextResponse } from 'next/server';
import '@/lib/export/ensureStandardFonts';
import { generateResumePdf } from '@/lib/export/pdfGenerator';
import { TailoredResume, Profile, ResumeTemplate } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resume, profile, template } = body as {
      resume: TailoredResume;
      profile: Profile;
      template: ResumeTemplate;
    };

    if (!resume || !profile || !template) {
      return NextResponse.json(
        { error: 'Missing required parameters (resume, profile, or template).' },
        { status: 400 }
      );
    }

    if (!profile.personalInfo?.fullName) {
      return NextResponse.json(
        { error: 'Profile must contain personal information with candidate name.' },
        { status: 400 }
      );
    }

    const pdfBuffer = await generateResumePdf(resume, profile, template);

    // Compute filename e.g. Rudresh_M_Resume_Stripe.pdf or Rudresh_M_Resume.pdf
    const company = (resume.title && resume.title.includes(' at ')) ? resume.title.split(' at ')[1] : '';
    const cleanCompany = company.replace(/[^a-zA-Z0-9]/g, '_').trim();
    const cleanName = profile.personalInfo.fullName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = cleanCompany ? `${cleanName}_Resume_${cleanCompany}.pdf` : `${cleanName}_Resume.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Error exporting PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF document: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
