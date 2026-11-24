import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authServer';
import { mongoRepository } from '@/lib/db/mongoRepository';
import { isMongoConfigured } from '@/lib/db/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing application ID' }, { status: 400 });
    }

    const app = await mongoRepository.getApplicationById(id, auth.auth0Id);
    if (app) {
      return NextResponse.json(app);
    }

    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Error fetching application by ID:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing application ID' }, { status: 400 });
    }

    const deleted = await mongoRepository.deleteApplication(id, auth.auth0Id);
    if (!deleted) {
      return NextResponse.json({ error: 'Application not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error deleting application:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = params;
    const body = await req.json();
    if (!id || !body) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const app = await mongoRepository.getApplicationById(id, auth.auth0Id);
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const updated = {
      ...app,
      ...body,
      userId: auth.auth0Id,
      updatedAt: new Date().toISOString(),
    };
    const saved = await mongoRepository.saveApplication(auth.auth0Id, updated);
    return NextResponse.json(saved);
  } catch (error: any) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
