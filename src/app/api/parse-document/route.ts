import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromDocx, extractTextFromPdf } from '@/lib/parser/documentParser';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

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

    return NextResponse.json(result);
  } catch (error) {
    console.error('Document parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to process document.' },
      { status: 500 }
    );
  }
}
