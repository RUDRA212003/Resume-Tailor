import { NextRequest, NextResponse } from 'next/server';
import { mongoRepository } from '@/lib/db/mongoRepository';
import { requireAuth } from '@/lib/auth/authServer';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing resume ID' }, { status: 400 });
    }

    // Strict ownership verification - returns null if belongs to another user
    const resume = await mongoRepository.getTailoredResumeById(id, auth.auth0Id);
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    return NextResponse.json(resume);
  } catch (error: any) {
    console.error('Error fetching tailored resume by ID:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing resume ID' }, { status: 400 });
    }

    // Strict ownership verification - cannot delete another user's resume
    const deleted = await mongoRepository.deleteTailoredResume(id, auth.auth0Id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Resume not found or unauthorized to delete.' },
        { status: 404 }
      );
    }

    await mongoRepository.recordHistory(auth.auth0Id, 'tailored_resume_deleted', id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting tailored resume:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
