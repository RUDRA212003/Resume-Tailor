import { NextRequest, NextResponse } from 'next/server';
import { mongoRepository } from '@/lib/db/mongoRepository';
import { isMongoConfigured } from '@/lib/db/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing application ID' }, { status: 400 });
    }

    if (isMongoConfigured()) {
      const app = await mongoRepository.getApplicationById(id);
      if (app) {
        return NextResponse.json(app);
      }
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
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing application ID' }, { status: 400 });
    }

    if (isMongoConfigured()) {
      const deleted = await mongoRepository.deleteApplication(id);
      return NextResponse.json({ success: deleted });
    }

    return NextResponse.json({ success: true, _storage: 'local' });
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
    const { id } = params;
    const body = await req.json();
    if (!id || !body) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (isMongoConfigured()) {
      const app = await mongoRepository.getApplicationById(id);
      if (!app) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }
      const updated = { ...app, ...body, updatedAt: new Date().toISOString() };
      const saved = await mongoRepository.saveApplication(updated);
      return NextResponse.json(saved);
    }

    return NextResponse.json({ ...body, updatedAt: new Date().toISOString() });
  } catch (error: any) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
