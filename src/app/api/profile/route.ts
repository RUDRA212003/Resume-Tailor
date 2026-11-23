import { NextRequest, NextResponse } from 'next/server';
import { mongoRepository } from '@/lib/db/mongoRepository';
import { DEFAULT_PROFILE } from '@/lib/storage/defaultData';
import { isMongoConfigured } from '@/lib/db/mongodb';
import { Profile } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (isMongoConfigured()) {
      const profile = await mongoRepository.getProfile('usr_001_demo');
      return NextResponse.json({
        ...profile,
        _storage: 'mongodb',
        savedToDb: true,
      });
    }
    return NextResponse.json({
      ...DEFAULT_PROFILE,
      _storage: 'local',
      savedToDb: false,
    });
  } catch (error: any) {
    console.error('Error fetching profile from MongoDB:', error);
    return NextResponse.json({
      ...DEFAULT_PROFILE,
      _storage: 'local',
      savedToDb: false,
      error: error.message || 'Database error',
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Profile;
    if (!body || !body.personalInfo?.fullName) {
      return NextResponse.json({ error: 'Invalid profile data provided.' }, { status: 400 });
    }

    if (isMongoConfigured()) {
      try {
        const saved = await mongoRepository.saveProfile(body);
        return NextResponse.json({
          ...saved,
          _storage: 'mongodb',
          savedToDb: true,
        });
      } catch (dbErr: any) {
        console.error('MongoDB save failed:', dbErr);
        return NextResponse.json(
          {
            ...body,
            _storage: 'local',
            savedToDb: false,
            error: `MongoDB write failed: ${dbErr.message || 'Network or authentication error'}. Changes stored in local session.`,
          },
          { status: 200 }
        );
      }
    }
    return NextResponse.json({
      ...body,
      _storage: 'local',
      savedToDb: false,
      warning: 'MongoDB is not configured. Saved in local storage only.',
    });
  } catch (error: any) {
    console.error('Error saving profile to MongoDB:', error);
    return NextResponse.json(
      { error: 'Failed to save profile: ' + (error.message || 'Invalid payload') },
      { status: 500 }
    );
  }
}
