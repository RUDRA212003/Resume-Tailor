import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authServer';
import { mongoRepository } from '@/lib/db/mongoRepository';
import { isMongoConfigured } from '@/lib/db/mongodb';
import { SavedApplication } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    if (isMongoConfigured()) {
      const applications = await mongoRepository.getApplications(auth.auth0Id);
      return NextResponse.json({
        applications,
        _storage: 'mongodb',
        count: applications.length,
      });
    }

    const applications = await mongoRepository.getApplications(auth.auth0Id);
    return NextResponse.json({
      applications,
      _storage: 'memory',
      count: applications.length,
    });
  } catch (error: any) {
    console.error('Error fetching applications from MongoDB:', error);
    return NextResponse.json(
      { applications: [], error: error.message || 'Database error', _storage: 'local' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const body = (await req.json()) as SavedApplication;
    if (!body || !body.id) {
      return NextResponse.json({ error: 'Invalid application data.' }, { status: 400 });
    }

    // Enforce verified user ownership
    const userScopedApp: SavedApplication = {
      ...body,
      userId: auth.auth0Id,
    };

    if (isMongoConfigured()) {
      try {
        const saved = await mongoRepository.saveApplication(auth.auth0Id, userScopedApp);
        return NextResponse.json({
          ...saved,
          _storage: 'mongodb',
          savedToDb: true,
        });
      } catch (dbErr: any) {
        console.error('MongoDB save application failed:', dbErr);
        return NextResponse.json(
          {
            ...userScopedApp,
            _storage: 'local',
            savedToDb: false,
            error: dbErr.message || 'MongoDB write failed.',
          },
          { status: 200 }
        );
      }
    }

    const saved = await mongoRepository.saveApplication(auth.auth0Id, userScopedApp);
    return NextResponse.json({
      ...saved,
      _storage: 'memory',
      savedToDb: true,
    });
  } catch (error: any) {
    console.error('Error saving application:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
