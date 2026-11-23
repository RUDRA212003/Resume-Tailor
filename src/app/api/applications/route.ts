import { NextRequest, NextResponse } from 'next/server';
import { mongoRepository } from '@/lib/db/mongoRepository';
import { isMongoConfigured } from '@/lib/db/mongodb';
import { SavedApplication } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (isMongoConfigured()) {
      const applications = await mongoRepository.getApplications();
      return NextResponse.json({
        applications,
        _storage: 'mongodb',
        count: applications.length,
      });
    }
    return NextResponse.json({
      applications: [],
      _storage: 'local',
      count: 0,
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
    const body = (await req.json()) as SavedApplication;
    if (!body || !body.id) {
      return NextResponse.json({ error: 'Invalid application data.' }, { status: 400 });
    }

    if (isMongoConfigured()) {
      try {
        const saved = await mongoRepository.saveApplication(body);
        return NextResponse.json({
          ...saved,
          _storage: 'mongodb',
          savedToDb: true,
        });
      } catch (dbErr: any) {
        console.error('MongoDB save application failed:', dbErr);
        return NextResponse.json(
          {
            ...body,
            _storage: 'local',
            savedToDb: false,
            error: dbErr.message || 'MongoDB write failed.',
          },
          { status: 200 }
        );
      }
    }

    return NextResponse.json({
      ...body,
      _storage: 'local',
      savedToDb: false,
    });
  } catch (error: any) {
    console.error('Error saving application:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
