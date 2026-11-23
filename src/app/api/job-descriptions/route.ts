import { NextRequest, NextResponse } from 'next/server';
import { mongoRepository } from '@/lib/db/mongoRepository';
import { isMongoConfigured } from '@/lib/db/mongodb';
import { JobDescription } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (isMongoConfigured()) {
      const jds = await mongoRepository.getJobDescriptions();
      return NextResponse.json({
        jobDescriptions: jds,
        _storage: 'mongodb',
        count: jds.length,
      });
    }
    return NextResponse.json({
      jobDescriptions: [],
      _storage: 'local',
      count: 0,
    });
  } catch (error: any) {
    console.error('Error fetching job descriptions from MongoDB:', error);
    return NextResponse.json(
      { jobDescriptions: [], error: error.message || 'Database error', _storage: 'local' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as JobDescription;
    if (!body || !body.id) {
      return NextResponse.json({ error: 'Invalid job description data.' }, { status: 400 });
    }

    if (isMongoConfigured()) {
      try {
        const saved = await mongoRepository.saveJobDescription(body);
        return NextResponse.json({
          ...saved,
          _storage: 'mongodb',
          savedToDb: true,
        });
      } catch (dbErr: any) {
        console.error('MongoDB save job description failed:', dbErr);
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
    console.error('Error saving job description:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
