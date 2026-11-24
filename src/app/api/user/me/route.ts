import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authServer';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    return NextResponse.json({
      user: auth.user,
      authenticated: true,
    });
  } catch (error: any) {
    console.error('Error in /api/user/me:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
