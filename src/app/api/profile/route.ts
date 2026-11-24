import { NextRequest, NextResponse } from 'next/server';
import { mongoRepository } from '@/lib/db/mongoRepository';
import { isMongoConfigured } from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth/authServer';
import { Profile } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const profile = await mongoRepository.getProfile(
      auth.auth0Id,
      auth.user.name,
      auth.user.email
    );

    return NextResponse.json({
      ...profile,
      userId: auth.auth0Id,
      _storage: isMongoConfigured() ? 'mongodb' : 'memory',
      savedToDb: isMongoConfigured(),
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: error.message || 'Database error' },
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

    const body = (await req.json()) as Profile;
    if (!body || !body.personalInfo?.fullName) {
      return NextResponse.json({ error: 'Invalid profile data provided.' }, { status: 400 });
    }

    // Force verified identity from session, never trust body.userId
    const saved = await mongoRepository.saveProfile(auth.auth0Id, body);

    return NextResponse.json({
      ...saved,
      userId: auth.auth0Id,
      _storage: isMongoConfigured() ? 'mongodb' : 'memory',
      savedToDb: isMongoConfigured(),
    });
  } catch (error: any) {
    console.error('Error saving profile:', error);
    return NextResponse.json(
      { error: 'Failed to save profile: ' + (error.message || 'Invalid payload') },
      { status: 500 }
    );
  }
}
