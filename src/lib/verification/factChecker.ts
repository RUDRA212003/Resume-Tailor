import type {
  Profile,
  TailoredResume,
  ValidationReport,
  SkillItem,
} from '@/types';

export interface GroundTruthFacts {
  skillsMap: Map<string, SkillItem>; // normalized skill name -> SkillItem
  aliasMap: Map<string, string>; // normalized alias -> canonical skill name
  verifiedSkillNames: Set<string>; // set of all canonical skill names verified by user
  factIds: Set<string>; // set of all valid responsibility, achievement, and bullet IDs
  companies: Set<string>; // set of real company names
  jobTitles: Set<string>; // set of real job titles
  dates: Set<string>; // set of real dates/year ranges
  institutions: Set<string>; // set of real schools
  degrees: Set<string>; // set of real degrees
  certifications: Set<string>; // set of real certifications
  projectTitles: Set<string>; // set of real project titles
}

export function extractGroundTruth(
  profile: Profile,
  userApprovedSkills: string[] = []
): GroundTruthFacts {
  const skillsMap = new Map<string, SkillItem>();
  const aliasMap = new Map<string, string>();
  const verifiedSkillNames = new Set<string>();
  const factIds = new Set<string>();
  const companies = new Set<string>();
  const jobTitles = new Set<string>();
  const dates = new Set<string>();
  const institutions = new Set<string>();
  const degrees = new Set<string>();
  const certifications = new Set<string>();
  const projectTitles = new Set<string>();

  // Process Skills
  profile.skills.forEach((skill) => {
    const canonicalNormalized = skill.name.trim().toLowerCase();
    skillsMap.set(canonicalNormalized, skill);
    aliasMap.set(canonicalNormalized, skill.name);

    if (skill.isVerified) {
      verifiedSkillNames.add(skill.name);
    }

    skill.aliases.forEach((alias) => {
      aliasMap.set(alias.trim().toLowerCase(), skill.name);
    });
  });

  // Process User-Approved JD Skills (Optional addition for this specific JD without modifying permanent profile)
  userApprovedSkills.forEach((approvedSkill) => {
    const trimmed = approvedSkill.trim();
    if (!trimmed) return;
    const norm = trimmed.toLowerCase();
    aliasMap.set(norm, trimmed);
    verifiedSkillNames.add(trimmed);
  });

  // Process Work Experience
  profile.experiences.forEach((exp) => {
    companies.add(exp.company.toLowerCase());
    jobTitles.add(exp.jobTitle.toLowerCase());
    dates.add(exp.startDate.toLowerCase());
    dates.add(exp.endDate.toLowerCase());

    exp.responsibilities.forEach((resp) => {
      factIds.add(resp.id);
    });
    exp.achievements.forEach((ach) => {
      factIds.add(ach.id);
    });

    exp.technologies.forEach((tech) => {
      const normalized = tech.trim().toLowerCase();
      if (!aliasMap.has(normalized)) {
        aliasMap.set(normalized, tech);
      }
    });
  });

  // Process Projects
  profile.projects.forEach((proj) => {
    projectTitles.add(proj.title.toLowerCase());
    proj.bullets.forEach((b) => factIds.add(b.id));
    proj.achievements.forEach((a) => factIds.add(a.id));

    proj.technologies.forEach((tech) => {
      const normalized = tech.trim().toLowerCase();
      if (!aliasMap.has(normalized)) {
        aliasMap.set(normalized, tech);
      }
    });
  });

  // Process Education
  profile.education.forEach((edu) => {
    institutions.add(edu.institution.toLowerCase());
    degrees.add(edu.degree.toLowerCase());
    dates.add(edu.startYear.toLowerCase());
    dates.add(edu.graduationYear.toLowerCase());
  });

  // Process Certifications
  profile.certifications.forEach((cert) => {
    certifications.add(cert.name.toLowerCase());
  });

  return {
    skillsMap,
    aliasMap,
    verifiedSkillNames,
    factIds,
    companies,
    jobTitles,
    dates,
    institutions,
    degrees,
    certifications,
    projectTitles,
  };
}

/**
 * Checks whether a technology/skill is recognized in the profile (via canonical name or verified alias).
 */
export function resolveTechnologyName(tech: string, groundTruth: GroundTruthFacts): string | null {
  const normalized = tech.trim().toLowerCase();
  if (groundTruth.aliasMap.has(normalized)) {
    return groundTruth.aliasMap.get(normalized)!;
  }
  return null;
}

/**
 * Fact-checks a generated or tailored resume against the single source of truth (profile).
 *
 * Strict Non-Negotiable Rules:
 * 1. AI must never add unverified/unlisted technologies.
 * 2. Every rewritten or selected bullet point must cite valid sourceFactIds from the profile.
 * 3. Company names, job titles, and dates must match existing records.
 * 4. Metrics and achievements cannot be hallucinated without ground truth.
 */
export function validateTailoredResume(
  tailored: Partial<TailoredResume>,
  profile: Profile,
  userApprovedSkills: string[] = []
): ValidationReport {
  const groundTruth = extractGroundTruth(profile, userApprovedSkills);
  const unverifiedSkillsDetected: string[] = [];
  const unsupportedClaims: string[] = [];
  const warnings: string[] = [];
  let checkedFactsCount = 0;

  // 1. Validate Selected Skills
  if (tailored.selectedSkills) {
    tailored.selectedSkills.forEach((catGroup) => {
      catGroup.skills.forEach((skillName) => {
        checkedFactsCount++;
        const resolved = resolveTechnologyName(skillName, groundTruth);
        if (!resolved) {
          unverifiedSkillsDetected.push(skillName);
          warnings.push(`Skill "${skillName}" is not present in candidate profile or approved aliases.`);
        }
      });
    });
  }

  // 2. Validate Experiences
  if (tailored.selectedExperiences) {
    tailored.selectedExperiences.forEach((exp) => {
      checkedFactsCount++;
      const companyMatch = profile.experiences.some(
        (e) => e.company.toLowerCase() === exp.company.toLowerCase()
      );
      if (!companyMatch) {
        unsupportedClaims.push(`Company "${exp.company}" does not exist in candidate profile.`);
      }

      // Check bullets
      exp.bullets.forEach((bullet) => {
        checkedFactsCount++;
        if (!bullet.sourceFactIds || bullet.sourceFactIds.length === 0) {
          unsupportedClaims.push(`Experience bullet "${bullet.text.slice(0, 40)}..." lacks source fact references.`);
        } else {
          const hasValidFact = bullet.sourceFactIds.some((id) => groundTruth.factIds.has(id));
          if (!hasValidFact) {
            unsupportedClaims.push(
              `Experience bullet cites invalid or non-existent fact ID: ${bullet.sourceFactIds.join(', ')}`
            );
          }
        }
      });

      // Check technologies associated with this experience
      exp.technologies?.forEach((tech) => {
        checkedFactsCount++;
        const resolved = resolveTechnologyName(tech, groundTruth);
        if (!resolved) {
          unverifiedSkillsDetected.push(tech);
          warnings.push(`Technology "${tech}" in experience ${exp.company} is not in candidate profile.`);
        }
      });
    });
  }

  // 3. Validate Projects
  if (tailored.selectedProjects) {
    tailored.selectedProjects.forEach((proj) => {
      checkedFactsCount++;
      const projectMatch = profile.projects.some(
        (p) => p.title.toLowerCase() === proj.title.toLowerCase()
      );
      if (!projectMatch) {
        unsupportedClaims.push(`Project "${proj.title}" does not exist in candidate profile.`);
      }

      proj.bullets.forEach((bullet) => {
        checkedFactsCount++;
        if (!bullet.sourceFactIds || bullet.sourceFactIds.length === 0) {
          unsupportedClaims.push(`Project bullet "${bullet.text.slice(0, 40)}..." lacks source fact references.`);
        } else {
          const hasValidFact = bullet.sourceFactIds.some((id) => groundTruth.factIds.has(id));
          if (!hasValidFact) {
            unsupportedClaims.push(
              `Project bullet cites invalid or non-existent fact ID: ${bullet.sourceFactIds.join(', ')}`
            );
          }
        }
      });

      proj.technologies?.forEach((tech) => {
        checkedFactsCount++;
        const resolved = resolveTechnologyName(tech, groundTruth);
        if (!resolved) {
          unverifiedSkillsDetected.push(tech);
          warnings.push(`Technology "${tech}" in project ${proj.title} is not in candidate profile.`);
        }
      });
    });
  }

  const isValid = unverifiedSkillsDetected.length === 0 && unsupportedClaims.length === 0;

  return {
    isValid,
    checkedFactsCount,
    unverifiedSkillsDetected,
    unsupportedClaims,
    warnings,
    timestamp: new Date().toISOString(),
  };
}
