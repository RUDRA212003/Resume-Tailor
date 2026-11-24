import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromDocx, extractTextFromPdf } from '@/lib/parser/documentParser';
import { extractProfileFromResumeWithAI } from '@/lib/ai/resumeParser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let text = '';
    let wordCount = 0;
    let characterCount = 0;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No resume file uploaded.' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileName = file.name.toLowerCase();

      let parsedDoc;
      if (fileName.endsWith('.docx')) {
        parsedDoc = await extractTextFromDocx(buffer);
      } else if (fileName.endsWith('.pdf')) {
        parsedDoc = await extractTextFromPdf(buffer);
      } else if (fileName.endsWith('.txt')) {
        const txt = buffer.toString('utf-8');
        parsedDoc = {
          text: txt,
          wordCount: txt.split(/\s+/).filter(Boolean).length,
          characterCount: txt.length,
          isScannedOrUnreadable: false,
        };
      } else {
        return NextResponse.json(
          { error: 'Unsupported format. Please upload PDF, DOCX, or TXT.' },
          { status: 400 }
        );
      }

      if (parsedDoc.isScannedOrUnreadable) {
        return NextResponse.json(
          {
            error: parsedDoc.warning || 'Scanned or unreadable document.',
            isScannedOrUnreadable: true,
          },
          { status: 422 }
        );
      }

      text = parsedDoc.text;
      wordCount = parsedDoc.wordCount;
      characterCount = parsedDoc.characterCount;
    } else {
      const body = await req.json();
      text = body?.text || '';
      wordCount = text.split(/\s+/).filter(Boolean).length;
      characterCount = text.length;
    }

    if (!text || text.trim().length < 15) {
      return NextResponse.json(
        { error: 'No readable text content found to extract profile details.' },
        { status: 400 }
      );
    }

    const profile = await extractProfileFromResumeWithAI(text);

    return NextResponse.json({
      success: true,
      profile,
      wordCount,
      characterCount,
    });
  } catch (error: any) {
    console.error('Error in AI parse-resume:', error);
    return NextResponse.json(
      { error: 'Failed to extract resume details: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
