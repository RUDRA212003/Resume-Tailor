import { NextResponse } from 'next/server';
import { isMongoConfigured, getMongoClient } from '@/lib/db/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isMongoConfigured()) {
    return NextResponse.json({
      configured: false,
      connected: false,
      dbType: 'local',
      message: 'MongoDB URI is not configured. Running in resilient local repository mode.',
    });
  }

  try {
    const client = await getMongoClient();
    // Ping admin with timeout
    await client.db('admin').command({ ping: 1 });
    const db = client.db('resumecraft');
    const profileCount = await db.collection('profiles').countDocuments();
    const tailoredCount = await db.collection('tailored_resumes').countDocuments();

    return NextResponse.json({
      configured: true,
      connected: true,
      dbType: 'mongodb',
      message: 'Successfully connected to MongoDB Atlas cluster.',
      stats: {
        profiles: profileCount,
        tailoredResumes: tailoredCount,
      },
    });
  } catch (error: any) {
    console.error('MongoDB connection check error:', error.message || error);
    return NextResponse.json({
      configured: true,
      connected: false,
      dbType: 'mongodb',
      error: error.message || 'Connection failed',
      message: 'Failed to connect to MongoDB Atlas cluster. Please check network connectivity, IP access list, and credentials.',
    });
  }
}
