import { NextRequest, NextResponse } from 'next/server';
import { mongoRepository } from '@/lib/db/mongoRepository';
import { isMongoConfigured } from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth/authServer';
import { TailoredResume } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const resumes = await mongoRepository.getTailoredResumes(auth.auth0Id);
    return NextResponse.json({
      resumes,
      _storage: isMongoConfigured() ? 'mongodb' : 'memory',
      count: resumes.length,
    });
  } catch (error: any) {
    console.error('Error fetching tailored resumes:', error);
    return NextResponse.json(
      { resumes: [], error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const body = (await req.json()) as TailoredResume;
    if (!body || !body.id) {
      return NextResponse.json({ error: 'Invalid tailored resume data.' }, { status: 400 });
    }

    // Enforce verified user ownership
    const saved = await mongoRepository.saveTailoredResume(auth.auth0Id, body);

    // Record activity in user's history
    await mongoRepository.recordHistory(
      auth.auth0Id,
      'tailored_resume_created',
      saved.id,
      { title: saved.title, templateId: saved.templateId }
    );

    return NextResponse.json({
      ...saved,
      userId: auth.auth0Id,
      _storage: isMongoConfigured() ? 'mongodb' : 'memory',
      savedToDb: isMongoConfigured(),
    });
  } catch (error: any) {
    console.error('Error saving tailored resume:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
