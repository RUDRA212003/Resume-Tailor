import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromDocx, extractTextFromPdf } from '@/lib/parser/documentParser';
import { extractProfileFromResumeWithAI } from '@/lib/ai/resumeParser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const shouldExtractProfile = formData.get('extractProfile') === 'true' || formData.get('mode') === 'profile';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name.toLowerCase();

    let result;
    if (fileName.endsWith('.docx')) {
      result = await extractTextFromDocx(buffer);
    } else if (fileName.endsWith('.pdf')) {
      result = await extractTextFromPdf(buffer);
    } else if (fileName.endsWith('.txt')) {
      const text = buffer.toString('utf-8');
      result = {
        text,
        wordCount: text.split(/\s+/).filter(Boolean).length,
        characterCount: text.length,
        isScannedOrUnreadable: false,
      };
    } else {
      return NextResponse.json(
        { error: 'Unsupported file format. Please upload PDF, DOCX, or TXT.' },
        { status: 400 }
      );
    }

    if (shouldExtractProfile && result.text && !result.isScannedOrUnreadable) {
      try {
        const profile = await extractProfileFromResumeWithAI(result.text);
        return NextResponse.json({
          ...result,
          profile,
        });
      } catch (aiErr) {
        console.warn('AI profile extraction non-fatal error:', aiErr);
        return NextResponse.json(result);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Document parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to process document.' },
      { status: 500 }
    );
  }
}
