import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTailoredResume } from '../src/lib/ai/tailorEngine';
import { extractYearsOfExperience, analyzeJobDescription } from '../src/lib/ai/jdAnalyzer';
import { MOCK_SAMPLE_PROFILE as DEFAULT_PROFILE, BUILT_IN_TEMPLATES } from '../src/lib/storage/defaultData';

test('JD Adaptive Tailoring Engine Suite', async (t) => {
  const profile = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
  const template = BUILT_IN_TEMPLATES[0]; // ATS Single Column replica

  await t.test('1. Tailors project lines and profile description to Backend & SQL JD', async () => {
    const backendJd = {
      id: 'jd-test-backend',
      companyName: 'Fintech Corp',
      jobTitle: 'Senior Backend Engineer',
      rawText: 'Looking for a Backend Engineer with Java, Spring Boot, REST APIs, PostgreSQL/MongoDB, and ETL data pipelines.',
      sourceType: 'paste',
      createdAt: '2026-01-01',
    };

    const backendAnalysis = {
      id: 'analysis-backend',
      jobDescriptionId: backendJd.id,
      roleSummary: 'Senior Backend Engineer responsible for REST APIs, Spring Boot microservices, and database query optimization.',
      requiredSkills: [
        { name: 'Java', category: 'Backend Technologies', status: 'available' },
        { name: 'Spring Boot', category: 'Backend Technologies', status: 'available' },
        { name: 'PostgreSQL', category: 'Databases', status: 'available' },
        { name: 'MongoDB', category: 'Databases', status: 'available' },
      ],
      preferredSkills: [],
      responsibilities: ['Develop scalable REST APIs', 'Optimize database queries', 'Build ETL migration workflows'],
      qualifications: ['Bachelor degree in CS'],
      keywords: ['Backend', 'Spring Boot', 'REST APIs', 'PostgreSQL', 'MongoDB', 'ETL', 'Talend'],
      relevanceScore: 92,
      scoreBreakdown: {
        skillsMatchPercentage: 90,
        experienceRelevance: 95,
        projectRelevance: 90,
        keywordCoverage: 90,
        explanation: 'Strong backend match',
      },
      recommendations: ['Emphasize REST API design and query optimization'],
      analyzedAt: '2026-01-01',
    };

    const tailored = await generateTailoredResume(profile, backendJd, backendAnalysis, template);

    // Profile summary must be tailored to Backend
    assert.ok(
      tailored.summary.toLowerCase().includes('backend') || tailored.summary.toLowerCase().includes('spring boot'),
      'Tailored summary must spotlight backend and Spring Boot'
    );

    // Career Mock project description must be tailored to backend & APIs
    const cmProj = tailored.selectedProjects.find((p) => p.title.includes('Career Mock'));
    assert.ok(cmProj, 'Career Mock must be present');
    assert.ok(
      cmProj.description.toLowerCase().includes('backend') || cmProj.description.toLowerCase().includes('api'),
      'Career Mock project description must highlight backend APIs'
    );

    // Project lines (bullets) must be marked as rewritten with genuine sourceFactIds
    const rewrittenBullets = cmProj.bullets.filter((b) => b.isRewritten);
    assert.ok(rewrittenBullets.length > 0, 'Project lines must be tailored/rewritten');
    rewrittenBullets.forEach((b) => {
      assert.ok(b.sourceFactIds && b.sourceFactIds.length > 0, 'Every rewritten project line must have sourceFactIds');
      assert.ok(b.rewriteReason, 'Every rewritten project line must have a rewrite reason');
    });

    // Rupee Tracker project description must highlight data collection pipelines and APIs
    const rtProj = tailored.selectedProjects.find((p) => p.title.includes('Rupee Tracker'));
    assert.ok(rtProj, 'Rupee Tracker must be present');
    assert.ok(
      rtProj.description.toLowerCase().includes('pipeline') || rtProj.description.toLowerCase().includes('api'),
      'Rupee Tracker project description must highlight data pipelines and APIs'
    );

    // CAE experience bullets must be tailored
    const caeExp = tailored.selectedExperiences.find((e) => e.company === 'CAE');
    assert.ok(caeExp, 'CAE experience must be present');
    const caeRewritten = caeExp.bullets.filter((b) => b.isRewritten);
    assert.ok(caeRewritten.length > 0, 'CAE bullets must be tailored');

    // Validation must pass 100% (zero hallucinations)
    assert.equal(tailored.validationReport.isValid, true, 'Validation report must confirm 100% factual grounding');
    assert.equal(tailored.validationReport.unverifiedSkillsDetected.length, 0, 'No unverified skills detected');
  });

  await t.test('2. Tailors project lines and profile description to Frontend & Next.js JD', async () => {
    const frontendJd = {
      id: 'jd-test-frontend',
      companyName: 'Design Systems Inc',
      jobTitle: 'Frontend Engineer',
      rawText: 'Looking for a Frontend Engineer with React.js, Next.js, Tailwind CSS, TypeScript, and state management.',
      sourceType: 'paste',
      createdAt: '2026-01-01',
    };

    const frontendAnalysis = {
      id: 'analysis-frontend',
      jobDescriptionId: frontendJd.id,
      roleSummary: 'Frontend Engineer building modern web user interfaces with React, Next.js, and TypeScript.',
      requiredSkills: [
        { name: 'React.js', category: 'Frontend Technologies', status: 'available' },
        { name: 'Next.js', category: 'Frontend Technologies', status: 'available' },
        { name: 'Tailwind CSS', category: 'Frontend Technologies', status: 'available' },
        { name: 'TypeScript', category: 'Programming Languages', status: 'available' },
      ],
      preferredSkills: [],
      responsibilities: ['Build modern web UI', 'Integrate real-time streaming interfaces', 'Optimize web performance'],
      qualifications: ['Bachelor degree in CS'],
      keywords: ['Frontend', 'React.js', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Redux', 'Zustand'],
      relevanceScore: 94,
      scoreBreakdown: {
        skillsMatchPercentage: 95,
        experienceRelevance: 90,
        projectRelevance: 95,
        keywordCoverage: 95,
        explanation: 'Strong frontend match',
      },
      recommendations: ['Emphasize Next.js architecture and UI performance'],
      analyzedAt: '2026-01-01',
    };

    const tailored = await generateTailoredResume(profile, frontendJd, frontendAnalysis, template);

    // Profile summary must spotlight Frontend & Next.js
    assert.ok(
      tailored.summary.toLowerCase().includes('frontend') || tailored.summary.toLowerCase().includes('react.js'),
      'Tailored summary must spotlight frontend and React.js'
    );

    // Career Mock project description must highlight web platform & UI
    const cmProj = tailored.selectedProjects.find((p) => p.title.includes('Career Mock'));
    assert.ok(
      cmProj.description.toLowerCase().includes('platform') || cmProj.description.toLowerCase().includes('next.js'),
      'Career Mock project description must highlight Next.js web platform'
    );

    // Validation must pass 100%
    assert.equal(tailored.validationReport.isValid, true);
  });

  await t.test('3. Extracts required years of experience accurately from job description text', () => {
    // Range format
    const resRange = extractYearsOfExperience(
      'We are looking for a Software Engineer with 3-5 years of hands-on experience in Java and Spring Boot.'
    );
    assert.equal(resRange.experienceRequired, '3–5 years of experience');
    assert.equal(resRange.yearsOfExperienceRequired, 3);

    // Plus format
    const resPlus = extractYearsOfExperience(
      'Requirements: Minimum 4+ years of professional industry software engineering experience.'
    );
    assert.equal(resPlus.experienceRequired, '4+ years of experience');
    assert.equal(resPlus.yearsOfExperienceRequired, 4);

    // Fresher / Entry Level format
    const resFresher = extractYearsOfExperience(
      'Exciting opportunity for freshers and entry level graduates with strong CS fundamentals.'
    );
    assert.equal(resFresher.experienceRequired, '0–1 years (Fresher / Entry Level)');
    assert.equal(resFresher.yearsOfExperienceRequired, 0);

    // Senior keyword inference when no explicit number
    const resSenior = extractYearsOfExperience(
      'Seeking a Principal Lead Architect to spearhead cloud infrastructure.'
    );
    assert.equal(resSenior.experienceRequired, '5+ years (Senior / Lead level expected)');
    assert.equal(resSenior.yearsOfExperienceRequired, 5);

    // Unspecified fallback
    const resUnspecified = extractYearsOfExperience(
      'Great company culture, dynamic fast-paced team looking for passionate contributors.'
    );
    assert.equal(resUnspecified.experienceRequired, 'Not explicitly specified (Flexible)');
    assert.equal(resUnspecified.yearsOfExperienceRequired, null);
  });

  await t.test('4. JD Analysis attaches experienceRequired to analysis output', async () => {
    const jd = {
      id: 'jd-test-exp',
      companyName: 'Cloud Solutions Ltd',
      jobTitle: 'Backend Engineer',
      rawText: 'Looking for a Backend Developer with 2-4 years of experience in Node.js, TypeScript, and AWS.',
      sourceType: 'paste',
      createdAt: '2026-01-01',
    };

    const analysis = await analyzeJobDescription(jd, profile);
    assert.ok(analysis.experienceRequired, 'analysis.experienceRequired must be present');
    assert.ok(
      analysis.experienceRequired.includes('2–4') || analysis.experienceRequired.includes('2-4') || analysis.experienceRequired.includes('2'),
      'Experience required should reflect the 2-4 years requirement'
    );
    assert.equal(analysis.yearsOfExperienceRequired, 2);
  });
});
