import { NextRequest, NextResponse } from 'next/server';
import { mongoRepository } from '@/lib/db/mongoRepository';
import { isMongoConfigured } from '@/lib/db/mongodb';
import { TailoredResume } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (isMongoConfigured()) {
      const resumes = await mongoRepository.getTailoredResumes();
      return NextResponse.json({
        resumes,
        _storage: 'mongodb',
        count: resumes.length,
      });
    }
    return NextResponse.json({
      resumes: [],
      _storage: 'local',
      count: 0,
    });
  } catch (error: any) {
    console.error('Error fetching tailored resumes from MongoDB:', error);
    return NextResponse.json(
      { resumes: [], error: error.message || 'Database error', _storage: 'local' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TailoredResume;
    if (!body || !body.id) {
      return NextResponse.json({ error: 'Invalid tailored resume data.' }, { status: 400 });
    }

    if (isMongoConfigured()) {
      try {
        const saved = await mongoRepository.saveTailoredResume(body);
        return NextResponse.json({
          ...saved,
          _storage: 'mongodb',
          savedToDb: true,
        });
      } catch (dbErr: any) {
        console.error('MongoDB save tailored resume failed:', dbErr);
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
    console.error('Error saving tailored resume:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
