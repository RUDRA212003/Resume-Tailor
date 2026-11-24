import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { repository } from '../src/lib/storage/repository.ts';

describe('Client Storage Multi-User Data Isolation Tests', () => {
  it('1. When unauthenticated (no userId, no activeUser), getTailoredResumes returns []', () => {
    repository.setActiveUserId(null);
    assert.deepEqual(repository.getTailoredResumes(), []);
    assert.deepEqual(repository.getJobDescriptions(), []);
    assert.deepEqual(repository.getApplications(), []);
  });

  it('2. When User A logs in, User A can save and retrieve their tailored resumes', () => {
    const userA = 'auth0|test_user_a_123';
    repository.setActiveUserId(userA);

    const testResumeA = {
      id: 'resume_a_test',
      title: 'User A Tailored Resume',
      templateId: 'tmpl-single-page-ats',
      targetJobTitle: 'Fullstack Dev',
      companyName: 'Company A',
      jobDescriptionId: 'jd_a_1',
      profileSnapshotId: 'snap_a_1',
      sections: [],
      content: { summary: 'A summary' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    repository.saveTailoredResume(testResumeA);
    const resumesA = repository.getTailoredResumes();
    assert.equal(resumesA.length, 1);
    assert.equal(resumesA[0].id, 'resume_a_test');
  });

  it('3. When User B logs in, User B has a clean empty workspace and cannot see User A data', () => {
    const userB = 'auth0|test_user_b_456';
    repository.setActiveUserId(userB);

    const resumesB = repository.getTailoredResumes();
    assert.equal(resumesB.length, 0, 'User B must not see User A resumes');

    const jdsB = repository.getJobDescriptions();
    assert.equal(jdsB.length, 0, 'User B must not see User A JDs');
  });

  it('4. User B creates their own resume and does not affect User A', () => {
    const userB = 'auth0|test_user_b_456';
    repository.setActiveUserId(userB);

    const testResumeB = {
      id: 'resume_b_test',
      title: 'User B Tailored Resume',
      templateId: 'tmpl-single-page-ats',
      targetJobTitle: 'DevOps Lead',
      companyName: 'Company B',
      jobDescriptionId: 'jd_b_1',
      profileSnapshotId: 'snap_b_1',
      sections: [],
      content: { summary: 'B summary' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    repository.saveTailoredResume(testResumeB);
    const resumesB = repository.getTailoredResumes();
    assert.equal(resumesB.length, 1);
    assert.equal(resumesB[0].id, 'resume_b_test');

    // Switch back to User A
    const userA = 'auth0|test_user_a_123';
    repository.setActiveUserId(userA);
    const resumesA = repository.getTailoredResumes();
    assert.equal(resumesA.length, 1);
    assert.equal(resumesA[0].id, 'resume_a_test');
    assert.ok(!resumesA.some(r => r.id === 'resume_b_test'), 'User A must not see User B resume');
  });

  it('5. When logging out (activeUserId set to null), resumes return []', () => {
    repository.setActiveUserId(null);
    assert.deepEqual(repository.getTailoredResumes(), []);
    assert.deepEqual(repository.getJobDescriptions(), []);
    assert.deepEqual(repository.getApplications(), []);
  });
});
