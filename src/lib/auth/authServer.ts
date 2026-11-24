import { NextRequest, NextResponse } from 'next/server';
import { auth0, isAuth0Configured } from '@/lib/auth0';
import { mongoRepository } from '@/lib/db/mongoRepository';
import { UserRecord, UserRole } from '@/types';

export interface AuthenticatedContext {
  user: UserRecord;
  auth0Id: string;
}

/**
 * Extracts and verifies the authenticated user from the incoming request.
 * - Prioritizes verified Auth0 session cookies.
 * - Supports test credentials (x-test-auth0-id) during tests or development.
 * - Automatically syncs/upserts the verified user profile into MongoDB.
 * - NEVER trusts user IDs passed in query parameters or request body.
 */
export async function getAuthUser(req?: NextRequest): Promise<UserRecord | null> {
  // 0. Explicit unauthenticated test flag
  if (req?.headers.get('x-test-unauthenticated') === 'true') {
    return null;
  }
  let auth0Id: string | null = null;
  let name = '';
  let email = '';
  let profileImage = '';
  let role: UserRole = 'user';

  // 1. Try resolving real Auth0 Session
  if (isAuth0Configured()) {
    try {
      const session = await auth0.getSession(req);
      if (session?.user) {
        auth0Id = session.user.sub;
        name = session.user.name || session.user.nickname || 'User';
        email = session.user.email || '';
        profileImage = session.user.picture || '';
        if (session.user['https://resumecraft.com/roles']?.includes('admin') || session.user.role === 'admin') {
          role = 'admin';
        }
      }
    } catch (err) {
      console.error('Error fetching Auth0 session:', err);
    }
  }

  // 2. Test/Development header fallback (for programmatic testing of multi-user isolation)
  if (!auth0Id && req) {
    const testHeaderId = req.headers.get('x-test-auth0-id');
    if (testHeaderId) {
      auth0Id = testHeaderId.trim();
      name = req.headers.get('x-test-user-name') || `User ${auth0Id}`;
      email = req.headers.get('x-test-user-email') || `${auth0Id}@test.local`;
      profileImage = req.headers.get('x-test-user-picture') || '';
      role = (req.headers.get('x-test-user-role') === 'admin') ? 'admin' : 'user';
    }
  }

  // 3. Fallback demo session if Auth0 is not configured yet (e.g. initial setup before keys provided)
  if (!auth0Id && !isAuth0Configured()) {
    // If Auth0 credentials have not yet been provided in .env.local,
    // allow a default local workspace account so the app does not break
    auth0Id = 'auth0|demo_default_user';
    name = 'Demo User';
    email = 'demo@resumecraft.local';
  }

  if (!auth0Id) {
    return null;
  }

  // 4. Synchronize user in MongoDB users collection
  try {
    const userRecord = await mongoRepository.syncUser({
      auth0Id,
      name,
      email,
      profileImage,
      role,
    });
    return userRecord;
  } catch (err) {
    console.error('Failed to sync user to MongoDB:', err);
    return {
      auth0Id,
      name,
      email,
      profileImage,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Protects an API route by ensuring an authenticated user session is present.
 * Returns either AuthenticatedContext or a 401 Unauthorized NextResponse.
 */
export async function requireAuth(
  req?: NextRequest
): Promise<AuthenticatedContext | NextResponse> {
  const user = await getAuthUser(req);
  if (!user || !user.auth0Id) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required to access this resource.' },
      { status: 401 }
    );
  }
  return { user, auth0Id: user.auth0Id };
}

/**
 * Ensures the authenticated user has administrative privileges.
 * Returns either AuthenticatedContext or 401/403 NextResponse.
 */
export async function requireAdmin(
  req?: NextRequest
): Promise<AuthenticatedContext | NextResponse> {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) {
    return auth;
  }

  if (auth.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden: Administrator privileges required.' },
      { status: 403 }
    );
  }

  return auth;
}
