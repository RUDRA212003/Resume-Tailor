import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractProfileHeuristically,
  extractProfileFromResumeWithAI,
} from '../src/lib/ai/resumeParser.ts';

describe('AI & Heuristic Resume Parser Suite', () => {
  const sampleResumeText = `
Alex Morgan
alex.morgan@techcorp.example.com
(555) 345-6789
San Francisco, CA
https://linkedin.com/in/alexmorgan-dev
https://github.com/alexmorgan-dev
https://alexmorgan.dev

Professional Summary
Experienced Software Engineer with 5+ years of experience designing scalable distributed backend microservices and modern React applications.

Skills
Java, Spring Boot, TypeScript, React.js, Next.js, Node.js, PostgreSQL, Docker, Kubernetes, AWS, Git, JUnit

Experience
Senior Software Engineer at Stripe (2022-01 - Present)
San Francisco, CA
- Architected transactional payment microservices in Java and Spring Boot.
- Reduced database query latency by 45% on PostgreSQL clusters.

Software Engineer at Meta (2020-06 - 2021-12)
Menlo Park, CA
- Developed user interfaces using React.js and TypeScript.
- Integrated GraphQL APIs and optimized web bundle sizes.

Education
Bachelor of Science in Computer Science
Stanford University (2016 - 2020)
GPA: 3.9/4.0
  `;

  it('1. Heuristic fallback accurately parses personal info from raw text', () => {
    const profile = extractProfileHeuristically(sampleResumeText, 'test_user_123');

    assert.equal(profile.personalInfo.fullName, 'Alex Morgan');
    assert.equal(profile.personalInfo.email, 'alex.morgan@techcorp.example.com');
    assert.equal(profile.personalInfo.phone, '(555) 345-6789');
    assert.ok(profile.personalInfo.linkedinUrl.includes('linkedin.com/in/alexmorgan-dev'));
    assert.ok(profile.personalInfo.githubUrl.includes('github.com/alexmorgan-dev'));
  });

  it('2. Heuristic fallback extracts categorized skills', () => {
    const profile = extractProfileHeuristically(sampleResumeText, 'test_user_123');

    const skillNames = profile.skills.map((s) => s.name);
    assert.ok(skillNames.includes('Java'), 'Must detect Java');
    assert.ok(skillNames.includes('Spring Boot'), 'Must detect Spring Boot');
    assert.ok(skillNames.includes('React.js'), 'Must detect React.js');
    assert.ok(skillNames.includes('Docker'), 'Must detect Docker');
    assert.ok(skillNames.includes('PostgreSQL'), 'Must detect PostgreSQL');

    const javaSkill = profile.skills.find((s) => s.name === 'Java');
    assert.equal(javaSkill?.category, 'Programming Languages');
  });

  it('3. AI parser extracts profile and handles fallback gracefully', async () => {
    const profile = await extractProfileFromResumeWithAI(sampleResumeText, 'user_test_ai');

    assert.ok(profile.personalInfo.fullName.length > 0);
    assert.ok(profile.personalInfo.email.includes('@'));
    assert.ok(profile.skills.length > 0);
  });
});
