import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  ExternalHyperlink,
} from 'docx';
import { CoverLetterData } from '@/lib/ai/coverLetterEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const data: CoverLetterData = await req.json();

    if (!data || !data.candidateName || !data.companyName) {
      return NextResponse.json(
        { error: 'Missing cover letter data for DOCX export.' },
        { status: 400 }
      );
    }

    const docChildren: Paragraph[] = [];

    // Header: Candidate Name
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: data.candidateName.toUpperCase(),
            bold: true,
            size: 32, // 16pt
            font: 'Georgia',
            color: '000000',
          }),
        ],
      })
    );

    // Contact line
    const contactRuns: (TextRun | ExternalHyperlink)[] = [];
    if (data.candidatePhone) {
      contactRuns.push(
        new ExternalHyperlink({
          children: [
            new TextRun({
              text: data.candidatePhone,
              size: 20,
              font: 'Georgia',
              color: '000000',
            }),
          ],
          link: `tel:${data.candidatePhone.replace(/[^\d+]/g, '')}`,
        })
      );
    }
    if (data.candidateEmail) {
      if (contactRuns.length > 0) {
        contactRuns.push(new TextRun({ text: '   •   ', size: 20, font: 'Georgia', color: '666666' }));
      }
      contactRuns.push(
        new ExternalHyperlink({
          children: [
            new TextRun({
              text: data.candidateEmail,
              size: 20,
              font: 'Georgia',
              color: '000000',
            }),
          ],
          link: `mailto:${data.candidateEmail}`,
        })
      );
    }
    if (data.candidateLinkedin) {
      if (contactRuns.length > 0) {
        contactRuns.push(new TextRun({ text: '   •   ', size: 20, font: 'Georgia', color: '666666' }));
      }
      contactRuns.push(
        new ExternalHyperlink({
          children: [
            new TextRun({
              text: 'LinkedIn',
              size: 20,
              font: 'Georgia',
              color: '0066CC',
            }),
          ],
          link: data.candidateLinkedin,
        })
      );
    }
    if (data.candidatePortfolio) {
      if (contactRuns.length > 0) {
        contactRuns.push(new TextRun({ text: '   •   ', size: 20, font: 'Georgia', color: '666666' }));
      }
      contactRuns.push(
        new ExternalHyperlink({
          children: [
            new TextRun({
              text: 'Portfolio',
              size: 20,
              font: 'Georgia',
              color: '0066CC',
            }),
          ],
          link: data.candidatePortfolio,
        })
      );
    }

    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 280 },
        children: contactRuns,
      })
    );

    // Date
    docChildren.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: data.date,
            size: 22,
            font: 'Georgia',
            color: '333333',
          }),
        ],
      })
    );

    // Recipient Details
    docChildren.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: data.recipientName,
            bold: true,
            size: 22,
            font: 'Georgia',
            color: '000000',
          }),
        ],
      })
    );
    docChildren.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: data.recipientRole,
            size: 22,
            font: 'Georgia',
            color: '333333',
          }),
        ],
      })
    );
    docChildren.push(
      new Paragraph({
        spacing: { after: data.companyLocation ? 80 : 240 },
        children: [
          new TextRun({
            text: data.companyName,
            size: 22,
            font: 'Georgia',
            color: '333333',
          }),
        ],
      })
    );
    if (data.companyLocation) {
      docChildren.push(
        new Paragraph({
          spacing: { after: 240 },
          children: [
            new TextRun({
              text: data.companyLocation,
              size: 22,
              font: 'Georgia',
              color: '333333',
            }),
          ],
        })
      );
    }

    // Salutation
    docChildren.push(
      new Paragraph({
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: data.salutation,
            bold: true,
            size: 22,
            font: 'Georgia',
            color: '000000',
          }),
        ],
      })
    );

    // Paragraphs
    const paragraphs = [
      data.openingParagraph,
      data.technicalBodyParagraph,
      data.alignmentBodyParagraph,
      data.closingParagraph,
    ].filter(Boolean);

    paragraphs.forEach((pText) => {
      docChildren.push(
        new Paragraph({
          spacing: { after: 180, line: 320 },
          children: [
            new TextRun({
              text: pText,
              size: 22,
              font: 'Georgia',
              color: '1D1D1F',
            }),
          ],
        })
      );
    });

    // Signoff
    docChildren.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({
            text: data.signoff,
            size: 22,
            font: 'Georgia',
            color: '000000',
          }),
        ],
      })
    );
    docChildren.push(
      new Paragraph({
        spacing: { after: 0 },
        children: [
          new TextRun({
            text: data.candidateName,
            bold: true,
            size: 24,
            font: 'Georgia',
            color: '000000',
          }),
        ],
      })
    );

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1000,
                bottom: 1000,
                left: 1200,
                right: 1200,
              },
            },
          },
          children: docChildren,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const sanitizedCandidate = data.candidateName.replace(/\s+/g, '_');
    const sanitizedCompany = data.companyName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${sanitizedCandidate}_Cover_Letter_${sanitizedCompany}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error exporting cover letter DOCX:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export cover letter DOCX.' },
      { status: 500 }
    );
  }
}
