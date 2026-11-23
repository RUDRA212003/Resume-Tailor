import { NextRequest, NextResponse } from 'next/server';
import { mongoRepository } from '@/lib/db/mongoRepository';
import { isMongoConfigured } from '@/lib/db/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing resume ID' }, { status: 400 });
    }

    if (isMongoConfigured()) {
      const resume = await mongoRepository.getTailoredResumeById(id);
      if (resume) {
        return NextResponse.json(resume);
      }
    }

    return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Error fetching tailored resume by ID:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing resume ID' }, { status: 400 });
    }

    if (isMongoConfigured()) {
      const deleted = await mongoRepository.deleteTailoredResume(id);
      return NextResponse.json({ success: deleted });
    }

    return NextResponse.json({ success: true, _storage: 'local' });
  } catch (error: any) {
    console.error('Error deleting tailored resume:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
