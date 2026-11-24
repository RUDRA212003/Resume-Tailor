import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/authServer';
import { mongoRepository } from '@/lib/db/mongoRepository';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const users = await mongoRepository.getAllUsers();
    return NextResponse.json({
      users,
      count: users.length,
      requestedBy: auth.user.email,
    });
  } catch (error: any) {
    console.error('Error in /api/admin/users:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
