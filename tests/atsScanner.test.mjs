import test from 'node:test';
import assert from 'node:assert/strict';
import { scanResumeForAts } from '../src/lib/ai/atsScanner.ts';
import { validateTailoredResume } from '../src/lib/verification/factChecker.ts';
import { MOCK_SAMPLE_PROFILE as DEFAULT_PROFILE } from '../src/lib/storage/defaultData.ts';

test('ATS Friendly Scanner & JD Skills Override Suite', async (t) => {
  const dummyProfile = JSON.parse(JSON.stringify(DEFAULT_PROFILE));

  const dummyJd = {
    id: 'jd-001',
    companyName: 'Acme Corp',
    jobTitle: 'Full Stack Engineer',
    location: 'Bangalore',
    rawText: 'Looking for a Full Stack Engineer experienced with Java, Spring Boot, React.js, Docker, and Kubernetes.',
    createdAt: new Date().toISOString(),
  };

  const dummyResume = {
    id: 'tailored-res-001',
    jobDescriptionId: 'jd-001',
    templateId: 'tmpl-single-page-ats',
    profileSnapshotId: dummyProfile.id,
    title: 'RUDRESH M – Full Stack Engineer at Acme Corp',
    summary: 'Software Engineer experienced in Java, Spring Boot, React.js, and Docker microservices.',
    selectedSkills: [
      {
        category: 'Programming Languages',
        skills: ['Java', 'Docker'],
      },
    ],
    selectedExperiences: [
      {
        experienceId: dummyProfile.experiences[0].id,
        company: dummyProfile.experiences[0].company,
        jobTitle: dummyProfile.experiences[0].jobTitle,
        startDate: dummyProfile.experiences[0].startDate,
        endDate: dummyProfile.experiences[0].endDate,
        location: dummyProfile.experiences[0].location,
        technologies: ['Java'],
        bullets: [
          {
            id: 'tb-1',
            text: dummyProfile.experiences[0].responsibilities[0].text,
            sourceFactIds: [dummyProfile.experiences[0].responsibilities[0].id],
            technologies: ['Java'],
          },
        ],
      },
    ],
    selectedProjects: [
      {
        projectId: dummyProfile.projects[0].id,
        title: dummyProfile.projects[0].title,
        technologies: ['React.js'],
        bullets: [
          {
            id: 'tpb-1',
            text: dummyProfile.projects[0].bullets[0].text,
            sourceFactIds: [dummyProfile.projects[0].bullets[0].id],
            technologies: ['React.js'],
          },
        ],
      },
    ],
    education: dummyProfile.education,
    certifications: [],
    diff: {
      addedSkills: ['Docker'],
      omittedSkills: [],
      rewrittenCount: 0,
      omittedCount: 0,
      changes: [],
    },
    validationReport: {
      isValid: true,
      unverifiedSkillsDetected: [],
      unsupportedClaims: [],
      warnings: [],
      checkedFactsCount: 2,
      timestamp: new Date().toISOString(),
    },
    tailoringEngine: 'gemini-api',
  };

  await t.test('1. scanResumeForAts generates accurate score and breakdown', () => {
    const scan = scanResumeForAts(dummyResume, dummyJd, ['Docker']);

    assert.ok(typeof scan.overallScore === 'number');
    assert.ok(scan.overallScore >= 0 && scan.overallScore <= 100);
    assert.ok(scan.rating);
    assert.ok(scan.breakdown.keywordMatchScore > 0);
    assert.ok(scan.breakdown.structureScore > 0);
    assert.ok(scan.breakdown.impactScore > 0);
    assert.ok(scan.breakdown.formattingScore > 0);
    assert.ok(Array.isArray(scan.matchedKeywords));
    assert.ok(scan.matchedKeywords.includes('Docker'));
    assert.ok(scan.matchedKeywords.includes('Java'));
    assert.ok(scan.recommendations.length > 0);
  });

  await t.test('2. User-approved JD skill passes fact checking without hallucination flag', () => {
    const report = validateTailoredResume(dummyResume, dummyProfile, ['Docker']);

    assert.equal(report.isValid, true);
    assert.equal(report.unverifiedSkillsDetected.length, 0);
  });

  await t.test('3. Unapproved skill not in profile is flagged as unverified', () => {
    const resumeWithUnapprovedSkill = {
      ...dummyResume,
      selectedSkills: [
        {
          category: 'DevOps',
          skills: ['Kubernetes'], // Neither in profile nor userApprovedSkills
        },
      ],
    };

    const report = validateTailoredResume(resumeWithUnapprovedSkill, dummyProfile, []);
    assert.equal(report.isValid, false);
    assert.ok(report.unverifiedSkillsDetected.includes('Kubernetes'));
  });

  await t.test('4. Profile immutability guarantee: original profile skills are untouched', () => {
    const initialSkillsJson = JSON.stringify(dummyProfile.skills);
    scanResumeForAts(dummyResume, dummyJd, ['Docker']);
    validateTailoredResume(dummyResume, dummyProfile, ['Docker']);
    assert.equal(JSON.stringify(dummyProfile.skills), initialSkillsJson);
  });
});
