import test from 'node:test';
import assert from 'node:assert/strict';

// Import Ground Truth Fact Checker functions
import {
  extractGroundTruth,
  validateTailoredResume,
  resolveTechnologyName,
} from '../src/lib/verification/factChecker';
import { sanitizeProfileForAI } from '../src/lib/ai/privacySanitizer';
import { MOCK_SAMPLE_PROFILE as DEFAULT_PROFILE } from '../src/lib/storage/defaultData';

test('Critical Factual Accuracy Suite', async (t) => {
  const profile = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
  const groundTruth = extractGroundTruth(profile);

  await t.test('1. AI never adds an unlisted technology (Detects and rejects unverified tech)', () => {
    const tailoredDraft = {
      selectedSkills: [
        {
          category: 'Programming Languages',
          skills: ['Java', 'Golang', 'Haskell'], // 'Golang' and 'Haskell' are NOT in profile
        },
      ],
      selectedExperiences: [],
      selectedProjects: [],
    };

    const report = validateTailoredResume(tailoredDraft, profile);

    assert.equal(report.isValid, false, 'Validation must fail when unlisted skills are introduced');
    assert.ok(report.unverifiedSkillsDetected.includes('Golang'), 'Golang must be detected as unverified');
    assert.ok(report.unverifiedSkillsDetected.includes('Haskell'), 'Haskell must be detected as unverified');
  });

  await t.test('2. Resolves valid technology aliases correctly (e.g. JS -> JavaScript, Postgres -> PostgreSQL)', () => {
    assert.equal(resolveTechnologyName('JS', groundTruth), 'JavaScript');
    assert.equal(resolveTechnologyName('js', groundTruth), 'JavaScript');
    assert.equal(resolveTechnologyName('Postgres', groundTruth), 'PostgreSQL');
    assert.equal(resolveTechnologyName('TS', groundTruth), 'TypeScript');
    assert.equal(resolveTechnologyName('React', groundTruth), 'React.js');
    assert.equal(resolveTechnologyName('NonExistentTech', groundTruth), null);
  });

  await t.test('3. Rejects hallucinated work experience companies and claims', () => {
    const tailoredDraft = {
      selectedSkills: [],
      selectedExperiences: [
        {
          experienceId: 'exp-fake',
          company: 'Fictional MegaCorp LLC', // Fictional company
          jobTitle: 'Senior Vice President of Engineering',
          employmentType: 'Full-time',
          startDate: '2020-01',
          endDate: '2023-01',
          location: 'New York, NY',
          technologies: ['Java'],
          bullets: [
            {
              id: 'b-fake-1',
              text: 'Single-handedly created a billion-dollar product line.',
              sourceFactIds: [], // Missing source fact IDs
              isRewritten: false,
            },
          ],
        },
      ],
      selectedProjects: [],
    };

    const report = validateTailoredResume(tailoredDraft, profile);

    assert.equal(report.isValid, false, 'Must reject fictional companies and unsourced bullets');
    assert.ok(
      report.unsupportedClaims.some((c) => c.includes('Fictional MegaCorp LLC')),
      'Must flag fictional company'
    );
    assert.ok(
      report.unsupportedClaims.some((c) => c.includes('lacks source fact references')),
      'Must flag bullet without source facts'
    );
  });

  await t.test('4. Validates genuine source fact IDs and passes grounded content', () => {
    const validDraft = {
      selectedSkills: [
        {
          category: 'Programming Languages',
          skills: ['Java', 'TypeScript'],
        },
        {
          category: 'Frontend Technologies',
          skills: ['React.js', 'Next.js', 'Tailwind CSS'],
        },
      ],
      selectedExperiences: [
        {
          experienceId: 'exp-001',
          company: 'CAE',
          jobTitle: 'Software Engineer Intern',
          employmentType: 'Internship',
          startDate: '2026-02',
          endDate: '2026-11',
          location: 'Bangalore, India',
          technologies: ['React.js', 'Spring Boot', 'Talend', 'Oracle SQL'],
          bullets: [
            {
              id: 'tb-1',
              text: 'Contributed to enterprise data migration projects by developing ETL workflows using Talend.',
              sourceFactIds: ['exp-cae-1'], // Valid existing fact ID
              isRewritten: true,
            },
          ],
        },
      ],
      selectedProjects: [
        {
          projectId: 'proj-001',
          title: 'Career Mock – AI-Powered Voice Interview Platform',
          description: 'Voice interview simulation platform',
          technologies: ['Next.js', 'Groq AI', 'Vapi', 'Supabase'],
          bullets: [
            {
              id: 'tpb-1',
              text: 'Developed and tested AI-powered voice interview workflows.',
              sourceFactIds: ['proj-cm-1'], // Valid project bullet fact ID
              isRewritten: false,
            },
          ],
        },
      ],
    };

    const report = validateTailoredResume(validDraft, profile);
    assert.equal(report.isValid, true, 'Valid grounded draft must pass fact verification');
    assert.equal(report.unverifiedSkillsDetected.length, 0);
    assert.equal(report.unsupportedClaims.length, 0);
  });

  await t.test('5. Rejects invalid or forged sourceFactIds', () => {
    const invalidFactDraft = {
      selectedSkills: [],
      selectedExperiences: [
        {
          experienceId: 'exp-001',
          company: 'CAE',
          jobTitle: 'Software Engineer Intern',
          employmentType: 'Internship',
          startDate: '2026-02',
          endDate: '2026-11',
          location: 'Bangalore, India',
          technologies: ['React.js'],
          bullets: [
            {
              id: 'tb-forged',
              text: 'Invented a metric that never happened.',
              sourceFactIds: ['exp-999-invented-id'], // Non-existent fact ID
              isRewritten: true,
            },
          ],
        },
      ],
      selectedProjects: [],
    };

    const report = validateTailoredResume(invalidFactDraft, profile);
    assert.equal(report.isValid, false, 'Must reject non-existent fact ID');
    assert.ok(
      report.unsupportedClaims.some((c) => c.includes('invalid or non-existent fact ID'))
    );
  });

  await t.test('6. PII Sanitizer strips personal details before AI transmission', () => {
    const sanitized = sanitizeProfileForAI(profile);

    assert.equal(sanitized.hasRedactedPII, true);
    assert.ok(sanitized.redactedFieldsCount >= 6, 'Should redact name, email, phone, location, etc.');

    // Ensure the sanitized payload does not expose raw email or phone
    assert.equal(sanitized.sanitizedText.includes(profile.personalInfo.email), false);
    assert.equal(sanitized.sanitizedText.includes(profile.personalInfo.phone), false);
    assert.equal(sanitized.sanitizedText.includes(profile.personalInfo.fullName), false);

    // But MUST contain the verified technical facts and fact IDs
    assert.ok(sanitized.sanitizedText.includes('exp-cae-1'));
    assert.ok(sanitized.sanitizedText.includes('Spring Boot'));
    assert.ok(sanitized.sanitizedText.includes('Career Mock'));
  });

  await t.test('7. Original profile immutability check', () => {
    const snapshotBefore = JSON.stringify(profile);

    // Run verification and sanitization
    const groundTruthTest = extractGroundTruth(profile);
    const sanitizedTest = sanitizeProfileForAI(profile);

    const snapshotAfter = JSON.stringify(profile);
    assert.equal(snapshotBefore, snapshotAfter, 'Profile must remain completely unchanged');
  });
});
