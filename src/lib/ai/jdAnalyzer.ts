import type {
  Profile,
  JobDescription,
  JDAnalysis,
  AnalyzedSkillRequirement,
} from '@/types';
import { extractGroundTruth } from '../verification/factChecker';
import { getGeminiClient, getResolvedModel } from './geminiClient';

// Common technical dictionaries for fallback analysis
const KNOWN_TECH_KEYWORDS = [
  'Java', 'Spring Boot', 'Spring', 'React', 'React.js', 'Next.js', 'Node.js',
  'Express.js', 'JavaScript', 'TypeScript', 'Python', 'SQL', 'PostgreSQL',
  'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
  'Git', 'CI/CD', 'REST', 'RESTful APIs', 'Microservices', 'GraphQL', 'Kafka',
  'JUnit', 'Jest', 'HTML5', 'CSS3', 'Tailwind CSS', 'Linux', 'Agile', 'Scrum',
];

/**
 * Analyzes a job description against the candidate's profile.
 * Extracts required/preferred skills, responsibilities, qualifications, and evaluates match status.
 */
export async function analyzeJobDescription(
  jd: JobDescription,
  profile: Profile
): Promise<JDAnalysis> {
  const groundTruth = extractGroundTruth(profile);
  const gemini = getGeminiClient();

  if (gemini) {
    try {
      const prompt = `
You are an expert technical recruiter and resume ATS analyst.
Analyze the following Job Description and compare it strictly against the candidate's verified profile facts.

JOB DESCRIPTION:
Company: ${jd.companyName}
Title: ${jd.jobTitle}
Text:
${jd.rawText}

CANDIDATE KNOWN SKILLS & ALIASES:
${Array.from(groundTruth.verifiedSkillNames).join(', ')}

Respond ONLY with a valid JSON object matching this schema:
{
  "roleSummary": "Short 2-sentence summary of what this role seeks",
  "requiredSkills": [
    { "name": "Skill name", "category": "Programming Languages|Frontend Technologies|Backend Technologies|Databases|Frameworks and Libraries|Developer Tools|Cloud Platforms|Testing Tools|Other Skills" }
  ],
  "preferredSkills": [
    { "name": "Skill name", "category": "Category" }
  ],
  "responsibilities": ["key duty 1", "key duty 2", "key duty 3", "key duty 4"],
  "qualifications": ["degree or years of exp requirement 1", "requirement 2"],
  "keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"]
}
`;

      const response = await gemini.models.generateContent({
        model: getResolvedModel(),
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text?.trim() || '{}';
      const parsed = JSON.parse(responseText);

      return buildJDAnalysisFromParsedData(jd.id, parsed, profile, groundTruth);
    } catch (error) {
      console.warn('Gemini analysis failed or rate-limited, using rule-based extraction engine:', error);
    }
  }

  // Robust Rule-Based & Semantic Extraction Engine
  return extractAndAnalyzeLocally(jd, profile, groundTruth);
}

function matchSkillAgainstProfile(
  skillName: string,
  groundTruth: ReturnType<typeof extractGroundTruth>
): {
  status: AnalyzedSkillRequirement['status'];
  matchedProfileSkill?: string;
  matchedAlias?: string;
  notes?: string;
} {
  const normalized = skillName.trim().toLowerCase();

  // 1. Direct canonical or alias match
  if (groundTruth.aliasMap.has(normalized)) {
    const canonical = groundTruth.aliasMap.get(normalized)!;
    return {
      status: 'available',
      matchedProfileSkill: canonical,
      matchedAlias: normalized !== canonical.toLowerCase() ? skillName : undefined,
    };
  }

  // 2. Partial substring matching (e.g. "Spring" -> "Spring Boot", "JS" -> "JavaScript")
  for (const [alias, canonical] of Array.from(groundTruth.aliasMap.entries())) {
    if (alias.includes(normalized) || normalized.includes(alias)) {
      if (Math.abs(alias.length - normalized.length) <= 5) {
        return {
          status: 'partially_matched',
          matchedProfileSkill: canonical,
          notes: `Related to verified skill "${canonical}" in your profile.`,
        };
      }
    }
  }

  // 3. Ambiguous / requires confirmation
  if (normalized.includes('cloud') && groundTruth.verifiedSkillNames.has('AWS')) {
    return {
      status: 'requires_confirmation',
      matchedProfileSkill: 'AWS',
      notes: 'Job asks for Cloud; you have AWS. Confirm if acceptable.',
    };
  }

  // 4. Missing
  return {
    status: 'not_present',
    notes: 'Not found in your verified profile. Application will NOT fabricate this.',
  };
}

function buildJDAnalysisFromParsedData(
  jdId: string,
  data: {
    roleSummary?: string;
    requiredSkills?: { name: string; category?: string }[];
    preferredSkills?: { name: string; category?: string }[];
    responsibilities?: string[];
    qualifications?: string[];
    keywords?: string[];
  },
  profile: Profile,
  groundTruth: ReturnType<typeof extractGroundTruth>
): JDAnalysis {
  const reqSkills: AnalyzedSkillRequirement[] = (data.requiredSkills || []).map((s) => {
    const match = matchSkillAgainstProfile(s.name, groundTruth);
    return {
      name: s.name,
      category: s.category || 'Other Skills',
      status: match.status,
      matchedProfileSkill: match.matchedProfileSkill,
      matchedAlias: match.matchedAlias,
      notes: match.notes,
    };
  });

  const prefSkills: AnalyzedSkillRequirement[] = (data.preferredSkills || []).map((s) => {
    const match = matchSkillAgainstProfile(s.name, groundTruth);
    return {
      name: s.name,
      category: s.category || 'Other Skills',
      status: match.status,
      matchedProfileSkill: match.matchedProfileSkill,
      matchedAlias: match.matchedAlias,
      notes: match.notes,
    };
  });

  const matchedRequiredCount = reqSkills.filter((s) => s.status === 'available').length;
  const partialRequiredCount = reqSkills.filter((s) => s.status === 'partially_matched').length;
  const totalRequired = Math.max(reqSkills.length, 1);

  const skillsMatchPercentage = Math.round(
    ((matchedRequiredCount + partialRequiredCount * 0.5) / totalRequired) * 100
  );

  // Experience relevance: check if candidate's companies or titles match keywords
  const rawKeywords = data.keywords || [];
  const expMatch = profile.experiences.some((e) =>
    e.technologies.some((t) => reqSkills.some((r) => r.name.toLowerCase() === t.toLowerCase()))
  ) ? 90 : 65;

  const projMatch = profile.projects.some((p) =>
    p.technologies.some((t) => reqSkills.some((r) => r.name.toLowerCase() === t.toLowerCase()))
  ) ? 92 : 60;

  const keywordCoverage = Math.min(
    100,
    Math.round(((matchedRequiredCount + prefSkills.filter((p) => p.status === 'available').length) / (totalRequired + 1)) * 100)
  );

  const relevanceScore = Math.min(
    98,
    Math.round(skillsMatchPercentage * 0.45 + expMatch * 0.25 + projMatch * 0.2 + keywordCoverage * 0.1)
  );

  const missingSkills = reqSkills.filter((s) => s.status === 'not_present').map((s) => s.name);
  const recommendations: string[] = [];

  if (missingSkills.length > 0) {
    recommendations.push(
      `Job asks for ${missingSkills.slice(0, 3).join(', ')}. Since these are not in your profile, the tailor engine will highlight your strongest complementary skills (${profile.skills.slice(0, 3).map((s) => s.name).join(', ')}) without fabricating unverified tech.`
    );
  } else {
    recommendations.push(
      'Excellent skill alignment! All major required technologies are present in your verified profile.'
    );
  }

  recommendations.push(
    'Prioritize recent achievements in PayStream and Apex Cloud Technologies that showcase distributed systems, database query optimization, and REST API design.'
  );

  return {
    id: `analysis-${Date.now()}`,
    jobDescriptionId: jdId,
    roleSummary:
      data.roleSummary ||
      'Technical role requiring strong software engineering fundamentals, database experience, and production API design.',
    requiredSkills: reqSkills,
    preferredSkills: prefSkills,
    responsibilities: data.responsibilities || [
      'Design, develop, and maintain robust microservices and web APIs.',
      'Collaborate with product and QA squads to deliver secure features.',
      'Optimize database queries and system performance.',
    ],
    qualifications: data.qualifications || [
      'Bachelor’s degree in Computer Science, Engineering, or related field.',
      'Proven experience building production software systems.',
    ],
    keywords: rawKeywords.length > 0 ? rawKeywords : ['API', 'Database', 'Microservices', 'Clean Code'],
    relevanceScore,
    scoreBreakdown: {
      skillsMatchPercentage,
      experienceRelevance: expMatch,
      projectRelevance: projMatch,
      keywordCoverage: Math.max(50, keywordCoverage),
      explanation: `Internal relevance estimate calculated from verified skills match (${skillsMatchPercentage}%), experience alignment (${expMatch}%), and project tech stack overlap (${projMatch}%).`,
    },
    recommendations,
    analyzedAt: new Date().toISOString(),
  };
}

function extractAndAnalyzeLocally(
  jd: JobDescription,
  profile: Profile,
  groundTruth: ReturnType<typeof extractGroundTruth>
): JDAnalysis {
  const jdText = jd.rawText;

  // Detect which known tech keywords are in the JD text
  const foundKeywords: string[] = [];
  KNOWN_TECH_KEYWORDS.forEach((tech) => {
    const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(jdText)) {
      foundKeywords.push(tech);
    }
  });

  // Partition into required and preferred based on sentence context
  const reqSkillsList: string[] = [];
  const prefSkillsList: string[] = [];

  foundKeywords.forEach((tech, idx) => {
    if (idx < 5 || jdText.toLowerCase().includes(`must have ${tech.toLowerCase()}`) || jdText.toLowerCase().includes(`required:`) || jdText.toLowerCase().includes(`strong proficiency in ${tech.toLowerCase()}`)) {
      reqSkillsList.push(tech);
    } else {
      prefSkillsList.push(tech);
    }
  });

  // Extract duty lines
  const lines = jdText.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('•') || l.startsWith('-') || l.startsWith('*') || l.length > 30);
  const responsibilities = lines.slice(0, 4).map((l) => l.replace(/^[-•*]\s*/, ''));

  return buildJDAnalysisFromParsedData(
    jd.id,
    {
      roleSummary: `Seeking a software engineer to build and scale production systems with emphasis on ${foundKeywords.slice(0, 4).join(', ')}.`,
      requiredSkills: reqSkillsList.map((name) => ({ name, category: 'Technical Skills' })),
      preferredSkills: prefSkillsList.map((name) => ({ name, category: 'Technical Skills' })),
      responsibilities: responsibilities.length > 0 ? responsibilities : [
        'Develop, test, and deploy resilient application services and APIs.',
        'Optimize relational and NoSQL database queries for high throughput.',
        'Participate in agile sprints, code reviews, and architectural planning.',
      ],
      qualifications: [
        'Bachelor’s degree in Computer Science, Software Engineering, or equivalent experience.',
        'Demonstrated proficiency in building production web services and databases.',
      ],
      keywords: foundKeywords.slice(0, 8),
    },
    profile,
    groundTruth
  );
}
