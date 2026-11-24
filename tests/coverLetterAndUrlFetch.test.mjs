import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCoverLetter } from '../src/lib/ai/coverLetterEngine.ts';
import { MOCK_SAMPLE_PROFILE as DEFAULT_PROFILE } from '../src/lib/storage/defaultData.ts';

test('Cover Letter Generation & API Suite', async (t) => {
  const profile = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
  const jd = {
    id: 'jd-stripe-backend',
    companyName: 'Stripe',
    jobTitle: 'Senior Backend Engineer',
    location: 'Bangalore, India',
    rawText: 'Looking for a Senior Backend Engineer experienced in Java, Spring Boot, REST APIs, and Docker containerization.',
    createdAt: new Date().toISOString(),
  };

  let generatedCoverLetter = null;

  await t.test('1. Generates 1-page Cover Letter grounded in verified profile facts and approved skills', async () => {
    generatedCoverLetter = await generateCoverLetter(profile, jd, undefined, ['Docker']);

    assert.ok(generatedCoverLetter);
    assert.equal(generatedCoverLetter.candidateName, 'RUDRESH M');
    assert.equal(generatedCoverLetter.candidateEmail, 'rudreshmanjunath15@gmail.com');
    assert.equal(generatedCoverLetter.candidatePhone, '+91 6364152219');
    assert.equal(generatedCoverLetter.companyName, 'Stripe');
    assert.ok(generatedCoverLetter.openingParagraph.includes('Stripe'));
    assert.ok(generatedCoverLetter.openingParagraph.includes('Senior Backend Engineer'));
    assert.ok(generatedCoverLetter.technicalBodyParagraph.length > 50);
    assert.ok(generatedCoverLetter.closingParagraph.length > 30);
    assert.ok(generatedCoverLetter.signoff);
  });

  await t.test('2. Cover Letter incorporates candidate-approved skills without altering master profile', async () => {
    const initialSkills = JSON.stringify(profile.skills);
    const clWithApproved = await generateCoverLetter(profile, jd, undefined, ['Docker', 'Kubernetes']);

    assert.ok(clWithApproved.fullLetterText.includes('Docker'));
    // Ensure master profile remains 100% immutable
    assert.equal(JSON.stringify(profile.skills), initialSkills);
  });

  await t.test('3. Generates genuine vector PDF via backend POST /api/export/cover-letter-pdf', async () => {
    assert.ok(generatedCoverLetter, 'Cover letter must be generated');
    const pdfRes = await fetch('http://127.0.0.1:3000/api/export/cover-letter-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(generatedCoverLetter),
    });

    assert.equal(pdfRes.status, 200);
    assert.equal(pdfRes.headers.get('content-type'), 'application/pdf');
    const buffer = Buffer.from(await pdfRes.arrayBuffer());
    assert.ok(buffer.length > 1000);
    assert.equal(buffer.subarray(0, 4).toString(), '%PDF');
  });

  await t.test('4. Generates editable DOCX via backend POST /api/export/cover-letter-docx', async () => {
    assert.ok(generatedCoverLetter, 'Cover letter must be generated');
    const docxRes = await fetch('http://127.0.0.1:3000/api/export/cover-letter-docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(generatedCoverLetter),
    });

    assert.equal(docxRes.status, 200);
    assert.ok(docxRes.headers.get('content-type').includes('wordprocessingml.document'));
    const buffer = Buffer.from(await docxRes.arrayBuffer());
    assert.ok(buffer.length > 1000);
  });
});
