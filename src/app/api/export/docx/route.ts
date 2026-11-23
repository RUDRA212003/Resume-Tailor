import { NextRequest, NextResponse } from 'next/server';
import { generateResumeDocx } from '@/lib/export/docxGenerator';
import { TailoredResume, Profile, ResumeTemplate } from '@/types';

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
        { error: 'Missing resume, profile, or template data.' },
        { status: 400 }
      );
    }

    const docxBuffer = await generateResumeDocx(resume, profile, template);

    const safeTitle = `${profile.personalInfo.fullName.replace(/[^a-zA-Z0-9]/g, '_')}_Resume.docx`;

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${safeTitle}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting DOCX:', error);
    return NextResponse.json(
      { error: 'Failed to generate DOCX document.' },
      { status: 500 }
    );
  }
}
