import test from 'node:test';
import assert from 'node:assert/strict';

import { generateResumeDocx } from '../src/lib/export/docxGenerator';
import { parseResumeTextToProfile } from '../src/lib/parser/documentParser';
import { DEFAULT_PROFILE, BUILT_IN_TEMPLATES } from '../src/lib/storage/defaultData';

test('Document Processing & Generation Suite', async (t) => {
  const profile = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
  const modernTemplate = BUILT_IN_TEMPLATES.find((t) => t.id === 'tmpl-modern-minimalist');
  const classicTemplate = BUILT_IN_TEMPLATES.find((t) => t.id === 'tmpl-executive-classic');

  await t.test('1. Generates valid DOCX buffer for Modern Minimalist template', async () => {
    const mockResume = {
      id: 'test-resume-1',
      jobDescriptionId: 'jd-test',
      templateId: modernTemplate.id,
      profileSnapshotId: profile.id,
      title: 'RUDRESH M – Senior Engineer Resume',
      summary: 'Experienced Full-Stack Engineer specializing in high-throughput systems.',
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
              id: 'b-1',
              text: 'Contributed to enterprise data migration projects by developing ETL workflows using Talend.',
              sourceFactIds: ['exp-cae-1'],
              isRewritten: false,
            },
          ],
        },
      ],
      selectedProjects: [
        {
          projectId: 'proj-001',
          title: 'Career Mock – AI-Powered Voice Interview Platform',
          description: 'Voice interview platform',
          technologies: ['Next.js', 'Groq AI', 'Vapi', 'Supabase'],
          bullets: [
            {
              id: 'pb-1',
              text: 'Developed and tested AI-powered voice interview workflows.',
              sourceFactIds: ['proj-cm-1'],
              isRewritten: false,
            },
          ],
        },
      ],
      education: profile.education,
      certifications: profile.certifications,
      achievements: profile.achievements,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docxBuffer = await generateResumeDocx(mockResume, profile, modernTemplate);

    assert.ok(Buffer.isBuffer(docxBuffer), 'Output must be a Node.js Buffer');
    assert.ok(docxBuffer.length > 1000, 'DOCX buffer must be non-empty and well-structured');

    // Check DOCX magic number (PK\x03\x04 zip archive header)
    assert.equal(docxBuffer[0], 0x50, 'Must start with PK zip header byte 0');
    assert.equal(docxBuffer[1], 0x4b, 'Must start with PK zip header byte 1');
  });

  await t.test('2. Generates valid DOCX buffer for Executive Classic template', async () => {
    const mockResume = {
      id: 'test-resume-2',
      jobDescriptionId: 'jd-test',
      templateId: classicTemplate.id,
      profileSnapshotId: profile.id,
      title: 'Alex Morgan – Classic Resume',
      summary: 'Backend Systems Engineer specializing in distributed databases and microservices.',
      selectedSkills: [
        { category: 'Programming Languages', skills: ['Java', 'SQL'] },
      ],
      selectedExperiences: [],
      selectedProjects: [],
      education: profile.education,
      certifications: profile.certifications,
      achievements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docxBuffer = await generateResumeDocx(mockResume, profile, classicTemplate);
    assert.ok(Buffer.isBuffer(docxBuffer));
    assert.ok(docxBuffer.length > 800);
  });

  await t.test('3. Parses raw resume text into structured profile candidate fields', () => {
    const sampleResumeText = `
Jane Doe
jane.doe@example.com
(555) 123-4567
linkedin.com/in/janedoe
github.com/janedoe

Skills:
Java, Spring Boot, React, TypeScript, Docker, PostgreSQL, AWS, Git

Experience:
Senior Software Engineer at Acme Corp (2022 - Present)
Built microservices in Java and deployed to AWS.
    `;

    const parsed = parseResumeTextToProfile(sampleResumeText);

    assert.equal(parsed.email, 'jane.doe@example.com');
    assert.equal(parsed.phone, '(555) 123-4567');
    assert.ok(parsed.detectedSkills.includes('Java'));
    assert.ok(parsed.detectedSkills.includes('Spring Boot'));
    assert.ok(parsed.detectedSkills.includes('React'));
    assert.ok(parsed.detectedSkills.includes('Docker'));
  });
});
