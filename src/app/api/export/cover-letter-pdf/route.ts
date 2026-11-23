import { NextRequest, NextResponse } from 'next/server';
import '@/lib/export/ensureStandardFonts';
import { CoverLetterData } from '@/lib/ai/coverLetterEngine';
import { generateCoverLetterPdfBuffer } from '@/lib/export/coverLetterPdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const data: CoverLetterData = await req.json();

    if (!data || !data.candidateName || !data.companyName) {
      return NextResponse.json(
        { error: 'Missing cover letter data for PDF export.' },
        { status: 400 }
      );
    }

    const pdfBuffer = await generateCoverLetterPdfBuffer(data);
    const sanitizedCandidate = data.candidateName.replace(/\s+/g, '_');
    const sanitizedCompany = data.companyName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${sanitizedCandidate}_Cover_Letter_${sanitizedCompany}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating cover letter PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate cover letter PDF.' },
      { status: 500 }
    );
  }
}
