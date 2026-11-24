import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';

import { GET as getTailoredResumes, POST as postTailoredResume } from '../src/app/api/tailored-resumes/route.ts';
import { GET as getTailoredResumeById, DELETE as deleteTailoredResumeById } from '../src/app/api/tailored-resumes/[id]/route.ts';
import { GET as getApplications, POST as postApplication } from '../src/app/api/applications/route.ts';
import { GET as getApplicationById, DELETE as deleteApplicationById } from '../src/app/api/applications/[id]/route.ts';
import { GET as getUserMe } from '../src/app/api/user/me/route.ts';
import { GET as getAdminUsers } from '../src/app/api/admin/users/route.ts';

function createMockRequest(url, { method = 'GET', body = null, headers = {} } = {}) {
  const init = {
    method,
    headers: { ...headers },
  };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers['content-type'] = 'application/json';
  }
  return new NextRequest(url, init);
}

describe('Multi-User Security & Data Isolation Tests', () => {
  const USER_A_HEADERS = {
    'x-test-auth0-id': 'auth0|test_user_alice_101',
    'x-test-user-name': 'Alice Smith',
    'x-test-user-email': 'alice@example.com',
  };

  const USER_B_HEADERS = {
    'x-test-auth0-id': 'auth0|test_user_bob_202',
    'x-test-user-name': 'Bob Jones',
    'x-test-user-email': 'bob@example.com',
  };

  const ADMIN_HEADERS = {
    'x-test-auth0-id': 'auth0|test_admin_root_999',
    'x-test-user-name': 'System Admin',
    'x-test-user-email': 'admin@example.com',
    'x-test-user-role': 'admin',
  };

  const resumeIdA = 'resume_alice_1';
  const appIdA = 'app_alice_1';

  it('1. Unauthenticated requests to protected endpoints are rejected with 401', async () => {
    const unauthReq = createMockRequest('http://localhost:3000/api/tailored-resumes', {
      headers: { 'x-test-unauthenticated': 'true' },
    });
    const res = await getTailoredResumes(unauthReq);
    assert.equal(res.status, 401, 'Expected 401 for unauthenticated request');
  });

  it('2. User A successfully authenticates and checks /api/user/me', async () => {
    const req = createMockRequest('http://localhost:3000/api/user/me', {
      headers: USER_A_HEADERS,
    });
    const res = await getUserMe(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.user.auth0Id, 'auth0|test_user_alice_101');
    assert.equal(data.user.role, 'user');
  });

  it('3. User A creates tailored resume and saved application', async () => {
    // Alice saves tailored resume
    const resReq = createMockRequest('http://localhost:3000/api/tailored-resumes', {
      method: 'POST',
      headers: USER_A_HEADERS,
      body: {
        id: resumeIdA,
        title: 'Senior Software Engineer at Stripe',
        summary: 'Alice summary',
        score: 92,
      },
    });
    const resRes = await postTailoredResume(resReq);
    assert.equal(resRes.status, 200);

    // Alice saves application
    const appReq = createMockRequest('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: USER_A_HEADERS,
      body: {
        id: appIdA,
        jobTitle: 'Senior Software Engineer',
        company: 'Stripe',
        status: 'applied',
        resumeId: resumeIdA,
      },
    });
    const appRes = await postApplication(appReq);
    assert.equal(appRes.status, 200);
  });

  it('4. User A can retrieve their own items', async () => {
    const resReq = createMockRequest('http://localhost:3000/api/tailored-resumes', {
      headers: USER_A_HEADERS,
    });
    const resRes = await getTailoredResumes(resReq);
    assert.equal(resRes.status, 200);
    const resData = await resRes.json();
    assert.ok(resData.resumes.some(r => r.id === resumeIdA));

    const appReq = createMockRequest('http://localhost:3000/api/applications', {
      headers: USER_A_HEADERS,
    });
    const appRes = await getApplications(appReq);
    assert.equal(appRes.status, 200);
    const appData = await appRes.json();
    assert.ok(appData.applications.some(a => a.id === appIdA));
  });

  it('5. User B logs in and gets strict data isolation (empty workspace)', async () => {
    const resReq = createMockRequest('http://localhost:3000/api/tailored-resumes', {
      headers: USER_B_HEADERS,
    });
    const resRes = await getTailoredResumes(resReq);
    assert.equal(resRes.status, 200);
    const resData = await resRes.json();
    assert.equal(resData.resumes.length, 0, 'User B must not see User A resumes');

    const appReq = createMockRequest('http://localhost:3000/api/applications', {
      headers: USER_B_HEADERS,
    });
    const appRes = await getApplications(appReq);
    assert.equal(appRes.status, 200);
    const appData = await appRes.json();
    assert.equal(appData.applications.length, 0, 'User B must not see User A applications');
  });

  it('6. IDOR Prevention: User B cannot GET User A record by ID', async () => {
    // Attempting to read Alice's resume by ID
    const getResReq = createMockRequest(`http://localhost:3000/api/tailored-resumes/${resumeIdA}`, {
      headers: USER_B_HEADERS,
    });
    const getResRes = await getTailoredResumeById(getResReq, { params: { id: resumeIdA } });
    assert.equal(getResRes.status, 404, 'Direct access to User A resume must return 404');

    // Attempting to read Alice's application by ID
    const getAppReq = createMockRequest(`http://localhost:3000/api/applications/${appIdA}`, {
      headers: USER_B_HEADERS,
    });
    const getAppRes = await getApplicationById(getAppReq, { params: { id: appIdA } });
    assert.equal(getAppRes.status, 404, 'Direct access to User A application must return 404');
  });

  it('7. IDOR Prevention: User B cannot DELETE User A record by ID', async () => {
    // Attempting to delete Alice's resume
    const delResReq = createMockRequest(`http://localhost:3000/api/tailored-resumes/${resumeIdA}`, {
      method: 'DELETE',
      headers: USER_B_HEADERS,
    });
    const delResRes = await deleteTailoredResumeById(delResReq, { params: { id: resumeIdA } });
    assert.equal(delResRes.status, 404, 'Deleting User A resume must return 404');

    // Verify Alice's resume is still alive
    const verifyReq = createMockRequest(`http://localhost:3000/api/tailored-resumes/${resumeIdA}`, {
      headers: USER_A_HEADERS,
    });
    const verifyRes = await getTailoredResumeById(verifyReq, { params: { id: resumeIdA } });
    assert.equal(verifyRes.status, 200, 'Alice resume must remain intact');
  });

  it('8. RBAC: Normal User cannot access /api/admin/users (403)', async () => {
    const userReq = createMockRequest('http://localhost:3000/api/admin/users', {
      headers: USER_A_HEADERS,
    });
    const userRes = await getAdminUsers(userReq);
    assert.equal(userRes.status, 403, 'Regular user must be forbidden from admin API');
  });

  it('9. RBAC: Admin User can access /api/admin/users (200)', async () => {
    const adminReq = createMockRequest('http://localhost:3000/api/admin/users', {
      headers: ADMIN_HEADERS,
    });
    const adminRes = await getAdminUsers(adminReq);
    assert.equal(adminRes.status, 200, 'Admin must be granted access');
    const data = await adminRes.json();
    assert.ok(data.users.length >= 2, 'Admin should see synced users');
  });
});
