import test from 'node:test';
import assert from 'node:assert/strict';
import pdfParse from 'pdf-parse';

function normalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return null;
  }

  if (lower.startsWith('mailto:')) {
    return trimmed;
  }
  if (trimmed.includes('@') && !trimmed.includes('/') && !trimmed.startsWith('http')) {
    return `mailto:${trimmed}`;
  }

  if (lower.startsWith('tel:')) {
    return trimmed;
  }
  if (/^\+?[0-9\s\-()]{7,20}$/.test(trimmed)) {
    const digits = trimmed.replace(/[^\d+]/g, '');
    return `tel:${digits}`;
  }

  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

test('PDF Generation & Interactive Hyperlinks Suite', async (t) => {
  // 1. URL Normalization Unit Tests
  await t.test('1. Validates and normalizes safe URL schemes', () => {
    assert.equal(normalizeUrl('https://linkedin.com/in/rudresh-m'), 'https://linkedin.com/in/rudresh-m');
    assert.equal(normalizeUrl('linkedin.com/in/rudresh-m'), 'https://linkedin.com/in/rudresh-m');
    assert.equal(normalizeUrl('rudreshmanjunath15@gmail.com'), 'mailto:rudreshmanjunath15@gmail.com');
    assert.equal(normalizeUrl('+91 6364152219'), 'tel:+916364152219');
    assert.equal(normalizeUrl('javascript:alert(1)'), null);
    assert.equal(normalizeUrl('data:text/html,...'), null);
    assert.equal(normalizeUrl('vbscript:msgbox'), null);
  });

  // Fetch verified profile from API
  const profileRes = await fetch('http://127.0.0.1:3000/api/profile');
  assert.equal(profileRes.status, 200, 'Profile endpoint must respond with 200');
  const profile = await profileRes.json();

  const testResume = {
    id: 'res-pdf-interactive-test',
    jobDescriptionId: 'jd-stripe-001',
    templateId: 'tmpl-modern-minimalist',
    profileSnapshotId: profile.id,
    title: 'RUDRESH M – Senior Backend Engineer at Stripe',
    summary: 'Software Engineer with enterprise experience building scalable full-stack applications with React.js and Spring Boot, developing robust ETL pipelines with Talend and Oracle SQL.',
    selectedSkills: [
      {
        category: 'Programming Languages',
        skills: ['Java', 'Python', 'JavaScript', 'TypeScript', 'SQL'],
      },
      {
        category: 'Backend Technologies',
        skills: ['Spring Boot', 'Node.js', 'RESTful APIs', 'Microservices'],
      },
      {
        category: 'Databases',
        skills: ['MongoDB', 'Oracle SQL', 'PostgreSQL'],
      },
    ],
    selectedExperiences: [
      {
        experienceId: 'exp-cae',
        company: 'CAE',
        jobTitle: 'Software Engineer Intern',
        employmentType: 'Internship',
        startDate: 'Aug 2024',
        endDate: 'Present',
        location: 'Bangalore, India',
        technologies: ['React.js', 'Spring Boot', 'Talend', 'Oracle SQL'],
        bullets: [
          {
            id: 'b-1',
            text: 'Architected full-stack enterprise automation application using React.js and Spring Boot.',
            sourceFactIds: ['exp-001-resp-1'],
            isRewritten: false,
          },
          {
            id: 'b-2',
            text: 'Engineered robust data migration pipelines using Talend and Oracle SQL.',
            sourceFactIds: ['exp-001-resp-2'],
            isRewritten: false,
          },
        ],
      },
    ],
    selectedProjects: [
      {
        projectId: 'proj-career-mock',
        title: 'Career Mock AI Interview Platform',
        description: 'AI-driven interview preparation platform.',
        technologies: ['Next.js', 'React', 'MongoDB', 'Gemini AI'],
        githubUrl: 'https://github.com/rudresh-m/career-mock',
        liveUrl: 'https://career-mock.vercel.app',
        duration: '2024',
        bullets: [
          {
            id: 'pb-1',
            text: 'Designed responsive user interface and integrated AI feedback loops.',
            sourceFactIds: ['proj-001-bullet-1'],
            isRewritten: false,
          },
        ],
      },
    ],
    education: profile.education,
    certifications: profile.certifications || [],
    achievements: profile.achievements || [],
    analysis: {
      id: 'a1',
      jobDescriptionId: 'jd-stripe-001',
      roleSummary: 'Senior Backend Engineer',
      requiredSkills: [],
      preferredSkills: [],
      responsibilities: [],
      qualifications: [],
      keywords: [],
      relevanceScore: 94,
      scoreBreakdown: {
        skillsMatchPercentage: 92,
        experienceRelevance: 95,
        projectRelevance: 90,
        keywordCoverage: 90,
        explanation: 'Excellent fit for core backend systems',
      },
    },
    diff: { changes: [], addedSkillsCount: 0, omittedSkillsCount: 0, rewrittenBulletsCount: 0 },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const testTemplate = {
    id: 'tmpl-modern-minimalist',
    name: 'Modern Minimalist',
    layoutType: 'modern',
    accentColor: '#0066CC',
    fontFamily: 'Helvetica',
    sectionsOrder: ['summary', 'skills', 'experience', 'projects', 'education'],
  };

  // 2. Call Backend PDF Generation Endpoint
  let pdfBuffer;
  let pdfRes;
  await t.test('2. Backend POST /api/export/pdf generates genuine binary PDF with headers', async () => {
    pdfRes = await fetch('http://127.0.0.1:3000/api/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume: testResume,
        profile,
        template: testTemplate,
      }),
    });

    assert.equal(pdfRes.status, 200, 'Must return 200 OK');
    assert.equal(pdfRes.headers.get('content-type'), 'application/pdf');
    const disposition = pdfRes.headers.get('content-disposition');
    assert.ok(disposition.includes('attachment'), 'Content-Disposition must specify attachment download');
    assert.ok(disposition.includes('.pdf'), 'Content-Disposition must end with .pdf');

    const arrayBuf = await pdfRes.arrayBuffer();
    pdfBuffer = Buffer.from(arrayBuf);
    assert.ok(pdfBuffer.length > 5000, `PDF size must be substantial (${pdfBuffer.length} bytes)`);

    const magic = pdfBuffer.slice(0, 5).toString('ascii');
    assert.equal(magic, '%PDF-', 'Buffer must begin with standard %PDF- magic signature');
  });

  // 3. Text Selectability & Searchability Verification
  await t.test('3. Text is extractable, selectable, and searchable (Vector PDF, not screenshot)', async () => {
    const parsed = await pdfParse(pdfBuffer);
    assert.ok(parsed.text.length > 200, 'PDF must contain selectable text');
    assert.ok(parsed.text.includes('RUDRESH M'), 'Candidate name must be searchable in text stream');
    assert.ok(parsed.text.includes('CAE'), 'Company name must be searchable in text stream');
    assert.ok(parsed.text.includes('Spring Boot'), 'Skills must be searchable in text stream');
    assert.ok(parsed.text.includes('Career Mock'), 'Project title must be searchable in text stream');
  });

  // 4. Clickable Hyperlink Annotations Inspection
  await t.test('4. PDF contains genuine clickable /Link annotations with verified destinations', () => {
    const rawPdf = pdfBuffer.toString('binary');

    // Verify PDF Link Annotations exist in object dictionary
    assert.ok(rawPdf.includes('/Subtype /Link') || rawPdf.includes('/Subtype/Link'), 'Must contain PDF /Link annotations');
    assert.ok(rawPdf.includes('/S /URI') || rawPdf.includes('/S/URI'), 'Link actions must specify /URI action type');

    // Verify contact links
    assert.ok(rawPdf.includes('linkedin.com/in/rudresh-m'), 'Must contain clickable LinkedIn link annotation');
    assert.ok(rawPdf.includes('github.com/rudresh-m'), 'Must contain clickable GitHub link annotation');
    assert.ok(rawPdf.includes('rudresh-portfolio') || rawPdf.includes('portfolio'), 'Must contain clickable Portfolio link annotation');
    assert.ok(rawPdf.includes('mailto:rudreshmanjunath15@gmail.com'), 'Must contain clickable mailto: email annotation');
    assert.ok(rawPdf.includes('tel:'), 'Must contain clickable tel: phone annotation');

    // Verify project repository and live links
    assert.ok(rawPdf.includes('github.com/rudresh-m/career-mock'), 'Must contain clickable project repo link annotation');
    assert.ok(rawPdf.includes('career-mock.vercel.app'), 'Must contain clickable live project demo link annotation');
  });

  // 5. Verify DOCX Export Continues to Function
  await t.test('5. DOCX Export continues to work cleanly with consistent data', async () => {
    const docxRes = await fetch('http://127.0.0.1:3000/api/export/docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume: testResume,
        profile,
        template: testTemplate,
      }),
    });

    assert.equal(docxRes.status, 200);
    assert.ok(docxRes.headers.get('content-type').includes('wordprocessingml'));
    const docxBuf = await docxRes.arrayBuffer();
    assert.ok(docxBuf.byteLength > 5000);
  });

  // 6. Verify Single-Page ATS Template (1-Page A4 Clean, No GitHub/Live link, No Achievements)
  await t.test('6. Single-Page ATS Template fits in exactly 1 A4 page with no github/live links or achievements', async () => {
    const singlePageTemplate = {
      id: 'tmpl-single-page-ats',
      name: 'Single-Page ATS (1-Page A4 Clean)',
      layoutType: 'compact',
      accentColor: '#1D1D1F',
      fontFamily: 'Times-Roman',
      sectionsOrder: ['summary', 'skills', 'experience', 'projects', 'education'],
    };

    const res = await fetch('http://localhost:3000/api/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume: {
          ...testResume,
          achievements: [
            { id: 'ach-1', title: 'Award', description: 'National coding award' },
          ],
        },
        profile,
        template: singlePageTemplate,
      }),
    });

    assert.equal(res.status, 200);
    const buf = Buffer.from(await res.arrayBuffer());
    const parsed = await pdfParse(buf);

    // Verify strictly 1 single A4 page
    assert.equal(parsed.numpages, 1, `Must strictly fit on 1 A4 page (actual pages: ${parsed.numpages})`);

    // Verify absence of GitHub link, [GitHub Repo], [Live Demo], and Achievements
    const rawPdf = buf.toString('binary');
    assert.ok(!rawPdf.includes('[GitHub Repo]'), 'Must not include [GitHub Repo]');
    assert.ok(!rawPdf.includes('[Live Demo]'), 'Must not include [Live Demo]');
    assert.ok(!parsed.text.includes('GitHub'), 'Header must not contain GitHub in compact single-page template');
    assert.ok(!parsed.text.includes('KEY ACHIEVEMENTS'), 'Must not contain Key Achievements section');

    // Verify presence of Phone, Email, LinkedIn, Portfolio
    assert.ok(rawPdf.includes('mailto:rudreshmanjunath15@gmail.com'), 'Must contain clickable email');
    assert.ok(rawPdf.includes('tel:'), 'Must contain clickable phone');
    assert.ok(rawPdf.includes('linkedin.com/in/rudresh-m'), 'Must contain clickable LinkedIn');
    assert.ok(rawPdf.includes('rudresh-portfolio') || rawPdf.includes('portfolio'), 'Must contain clickable Portfolio');
  });
});
