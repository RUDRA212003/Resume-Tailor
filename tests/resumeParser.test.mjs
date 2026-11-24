import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractProfileHeuristically,
  extractProfileFromResumeWithAI,
  parseAndCategorizeSkillsText,
} from '../src/lib/ai/resumeParser.ts';

describe('AI & Heuristic Resume Parser Suite', () => {
  const sampleResumeText = `
Alex Morgan
+1 (555) 345-6789alex.morgan@techcorp.comLinkedInPortfolio
San Francisco, CA
https://linkedin.com/in/alexmorgan-dev
https://github.com/alexmorgan-dev
https://alexmorgan.dev

PROFESSIONAL SUMMARY
Experienced Software Engineer with 5+ years of experience designing scalable distributed backend microservices and modern React applications.

TECHNICAL SKILLS
Programming Languages: Java, Python, TypeScript, SQL
Frontend Technologies: React.js, Next.js, Tailwind CSS
Databases: PostgreSQL, MySQL, MongoDB
Developer Tools: Git, Docker, Kubernetes

PROFESSIONAL EXPERIENCE
Stripe
2022-01 – Present
Senior Software Engineer
San Francisco, CA
• Architected transactional payment microservices in Java and Spring Boot.
• Reduced database query latency by 45% on PostgreSQL clusters.

EDUCATION
Bachelor of Science in Computer Science
Stanford University
2016 – 2020
Score: 3.9 / 4.0
  `;

  it('1. Accurately parses clean personal info without concatenated strings', () => {
    const profile = extractProfileHeuristically(sampleResumeText, 'test_user_123');

    assert.equal(profile.personalInfo.fullName, 'Alex Morgan');
    assert.equal(profile.personalInfo.email, 'alex.morgan@techcorp.com');
    assert.ok(profile.personalInfo.phone.includes('345-6789'));
  });

  it('2. Extracts categorized skills matching headings', () => {
    const profile = extractProfileHeuristically(sampleResumeText, 'test_user_123');

    const skillNames = profile.skills.map((s) => s.name);
    assert.ok(skillNames.includes('Java'));
    assert.ok(skillNames.includes('Python'));
    assert.ok(skillNames.includes('React.js'));
    assert.ok(skillNames.includes('PostgreSQL'));
    assert.ok(skillNames.includes('Docker'));

    const pg = profile.skills.find((s) => s.name === 'PostgreSQL');
    assert.equal(pg?.category, 'Databases');

    const java = profile.skills.find((s) => s.name === 'Java');
    assert.equal(java?.category, 'Programming Languages');
  });

  it('3. Extracts work experiences with title, dates, and duty bullets', () => {
    const profile = extractProfileHeuristically(sampleResumeText, 'test_user_123');

    assert.ok(profile.experiences.length >= 1);
    const exp = profile.experiences[0];
    assert.equal(exp.company, 'Stripe');
    assert.ok(exp.jobTitle.includes('Senior Software Engineer'));
    assert.ok(exp.responsibilities.length >= 1);
  });

  it('4. Extracts education details with institution, degree, and dates', () => {
    const profile = extractProfileHeuristically(sampleResumeText, 'test_user_123');

    assert.ok(profile.education.length >= 1);
    const edu = profile.education[0];
    assert.ok(edu.institution.includes('Stanford University'));
    assert.ok(edu.degree.includes('Bachelor of Science'));
    assert.equal(edu.startYear, '2016');
    assert.equal(edu.graduationYear, '2020');
  });

  it('5. AI Skill Organizer parses pasted raw skills with custom headings', () => {
    const rawSkills = `
Languages: Java, C++, Python, TypeScript
Front End: React.js, Next.js, Redux
Storage: MySQL, MongoDB, Redis
Dev Tools: Docker, Git, Postman
    `;

    const parsed = parseAndCategorizeSkillsText(rawSkills);
    assert.ok(parsed.length >= 10);

    const java = parsed.find((s) => s.name === 'Java');
    assert.equal(java?.category, 'Programming Languages');

    const react = parsed.find((s) => s.name === 'React.js');
    assert.equal(react?.category, 'Frontend Technologies');

    const mongo = parsed.find((s) => s.name === 'MongoDB');
    assert.equal(mongo?.category, 'Databases');

    const docker = parsed.find((s) => s.name === 'Docker');
    assert.equal(docker?.category, 'Developer Tools');
  });
});
