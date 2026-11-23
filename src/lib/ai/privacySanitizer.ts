import type { Profile } from '@/types';

export interface SanitizedProfileContext {
  sanitizedText: string;
  candidateAlias: string;
  hasRedactedPII: boolean;
  redactedFieldsCount: number;
}

/**
 * Strips personal PII (name, email, phone, location, personal URLs) before
 * profile facts are sent to external AI providers.
 *
 * This fulfills Section 11 Privacy Requirements:
 * "Before sending information to an external AI provider:
 * - Remove name, email, phone number and personal contact information.
 * - Avoid sending unnecessary personal information.
 * - Send only the minimum professional facts required for tailoring.
 * - Keep personal details locally in the application database."
 */
export function sanitizeProfileForAI(profile: Profile): SanitizedProfileContext {
  let redactedFieldsCount = 0;

  if (profile.personalInfo.fullName) redactedFieldsCount++;
  if (profile.personalInfo.email) redactedFieldsCount++;
  if (profile.personalInfo.phone) redactedFieldsCount++;
  if (profile.personalInfo.location) redactedFieldsCount++;
  if (profile.personalInfo.linkedinUrl) redactedFieldsCount++;
  if (profile.personalInfo.githubUrl) redactedFieldsCount++;

  // Construct structured facts without PII
  const structuredData = {
    summaries: profile.summaries.map((s) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      isDefault: s.isDefault,
    })),
    skills: profile.skills.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      aliases: s.aliases,
      proficiency: s.proficiency,
    })),
    experiences: profile.experiences.map((e) => ({
      id: e.id,
      company: e.company,
      jobTitle: e.jobTitle,
      employmentType: e.employmentType,
      startDate: e.startDate,
      endDate: e.endDate,
      technologies: e.technologies,
      responsibilities: e.responsibilities.map((r) => ({ id: r.id, text: r.text })),
      achievements: e.achievements.map((a) => ({ id: a.id, text: a.text })),
    })),
    projects: profile.projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      technologies: p.technologies,
      duration: p.duration,
      keywords: p.keywords,
      bullets: p.bullets.map((b) => ({ id: b.id, text: b.text })),
      achievements: p.achievements.map((a) => ({ id: a.id, text: a.text })),
    })),
    education: profile.education.map((edu) => ({
      id: edu.id,
      institution: edu.institution,
      degree: edu.degree,
      branch: edu.branch,
      startYear: edu.startYear,
      graduationYear: edu.graduationYear,
      cgpaOrPercentage: edu.cgpaOrPercentage,
    })),
    certifications: profile.certifications.map((c) => ({
      id: c.id,
      name: c.name,
      issuingOrg: c.issuingOrg,
      issueDate: c.issueDate,
    })),
  };

  return {
    sanitizedText: JSON.stringify(structuredData, null, 2),
    candidateAlias: 'CANDIDATE_ANONYMOUS',
    hasRedactedPII: true,
    redactedFieldsCount,
  };
}
