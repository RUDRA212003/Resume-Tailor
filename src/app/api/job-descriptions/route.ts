import { NextRequest, NextResponse } from 'next/server';
import { mongoRepository } from '@/lib/db/mongoRepository';
import { isMongoConfigured } from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth/authServer';
import { JobDescription } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const jds = await mongoRepository.getJobDescriptions(auth.auth0Id);
    return NextResponse.json({
      jobDescriptions: jds,
      _storage: isMongoConfigured() ? 'mongodb' : 'memory',
      count: jds.length,
    });
  } catch (error: any) {
    console.error('Error fetching job descriptions:', error);
    return NextResponse.json(
      { jobDescriptions: [], error: error.message || 'Database error' },
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

    const body = (await req.json()) as JobDescription;
    if (!body || !body.id) {
      return NextResponse.json({ error: 'Invalid job description data.' }, { status: 400 });
    }

    // Enforce verified user ownership
    const saved = await mongoRepository.saveJobDescription(auth.auth0Id, body);

    return NextResponse.json({
      ...saved,
      userId: auth.auth0Id,
      _storage: isMongoConfigured() ? 'mongodb' : 'memory',
      savedToDb: isMongoConfigured(),
    });
  } catch (error: any) {
    console.error('Error saving job description:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
