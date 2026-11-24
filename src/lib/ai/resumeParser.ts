import type {
  Profile,
  SkillCategory,
  SKILL_CATEGORIES,
  SkillItem,
  ExperienceItem,
  ProjectItem,
  EducationItem,
  CertificationItem,
  AchievementItem,
  SummaryVersion,
} from '@/types';
import { getGeminiClient, getResolvedModel } from './geminiClient';

const VALID_CATEGORIES = new Set<SkillCategory>([
  'Programming Languages',
  'Frontend Technologies',
  'Backend Technologies',
  'Databases',
  'Frameworks and Libraries',
  'Developer Tools',
  'Cloud Platforms',
  'Testing Tools',
  'Other Skills',
]);

function normalizeCategory(cat?: string): SkillCategory {
  if (cat && VALID_CATEGORIES.has(cat as SkillCategory)) {
    return cat as SkillCategory;
  }
  return 'Other Skills';
}

/**
 * Extracts a complete, structured Profile from raw resume text using Gemini AI,
 * falling back to a comprehensive heuristic/NLP rule engine if offline.
 */
export async function extractProfileFromResumeWithAI(
  rawText: string,
  userId = 'usr_imported'
): Promise<Profile> {
  const gemini = getGeminiClient();

  if (gemini && rawText.trim().length > 30) {
    try {
      const prompt = `
You are an expert AI resume parser. Extract the candidate's complete professional profile from the resume text below into a structured JSON object.

CRITICAL INSTRUCTIONS:
1. Extract ALL information faithfully without hallucinating or inventing details.
2. If a field is not present in the resume, leave it as an empty string ("") or empty array ([]).
3. personalInfo:
   - fullName: Full legal or professional candidate name.
   - email: Candidate email address.
   - phone: Candidate telephone / mobile number.
   - location: City, State/Province, Country.
   - linkedinUrl: Full LinkedIn profile URL.
   - githubUrl: Full GitHub profile URL.
   - portfolioUrl: Portfolio, personal website, or blog URL.
4. summaries:
   - Professional summary, objective, or profile statement.
5. skills:
   - Extract technical and domain skills.
   - Category MUST be one of: "Programming Languages", "Frontend Technologies", "Backend Technologies", "Databases", "Frameworks and Libraries", "Developer Tools", "Cloud Platforms", "Testing Tools", "Other Skills".
   - proficiency: "Beginner", "Intermediate", "Advanced", or "Expert".
6. experiences:
   - Work experience, internships, or employment.
   - employmentType: "Full-time" | "Part-time" | "Contract" | "Internship" | "Freelance".
   - startDate & endDate: Format as "YYYY-MM" or "Month YYYY" or "Present".
   - responsibilities: Array of duty / role description strings.
   - achievements: Array of quantifiable accomplishment strings.
   - technologies: Array of technology strings used in that role.
7. projects:
   - Academic, personal, or professional projects.
   - bullets: Array of bullet point strings describing the project.
   - technologies: Array of technology strings.
8. education:
   - Degree, institution, branch/major, startYear, graduationYear, cgpaOrPercentage.
9. certifications:
   - Name, issuingOrg, issueDate, expirationDate, credentialId.
10. achievements:
   - Honors, awards, hackathons, publications.

RESUME TEXT:
${rawText}

OUTPUT FORMAT:
Respond ONLY with a valid JSON object matching this schema:
{
  "personalInfo": {
    "fullName": "Candidate Name",
    "email": "candidate@example.com",
    "phone": "+1 555-0100",
    "location": "City, Country",
    "linkedinUrl": "https://linkedin.com/in/...",
    "githubUrl": "https://github.com/...",
    "portfolioUrl": ""
  },
  "summaries": [
    { "title": "Professional Summary", "content": "Summary text here..." }
  ],
  "skills": [
    { "name": "Java", "category": "Programming Languages", "proficiency": "Advanced", "aliases": ["Core Java"] }
  ],
  "experiences": [
    {
      "company": "Company Name",
      "jobTitle": "Job Title",
      "employmentType": "Full-time",
      "startDate": "2023-01",
      "endDate": "Present",
      "isCurrent": true,
      "location": "City, Country",
      "responsibilities": ["Duty 1", "Duty 2"],
      "achievements": ["Achievement 1"],
      "technologies": ["React", "Node.js"]
    }
  ],
  "projects": [
    {
      "title": "Project Title",
      "description": "Project overview",
      "technologies": ["Next.js", "TypeScript"],
      "githubUrl": "",
      "liveUrl": "",
      "duration": "2024",
      "bullets": ["Bullet 1", "Bullet 2"],
      "keywords": ["keyword"]
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Bachelor of Science",
      "branch": "Computer Science",
      "startYear": "2020",
      "graduationYear": "2024",
      "cgpaOrPercentage": "3.8/4.0",
      "additionalInfo": ""
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuingOrg": "Issuing Org",
      "issueDate": "2024",
      "credentialId": ""
    }
  ],
  "achievements": [
    {
      "title": "Achievement Title",
      "date": "2024",
      "description": "Details"
    }
  ]
}
`;

      const response = await gemini.models.generateContent({
        model: getResolvedModel(),
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = response.text?.trim() || '{}';
      const parsed = JSON.parse(responseText);

      return buildProfileFromParsedAi(parsed, userId);
    } catch (error) {
      console.warn('Gemini resume parsing failed or rate-limited, switching to heuristic rule engine:', error);
    }
  }

  // Fallback heuristic rule engine
  return extractProfileHeuristically(rawText, userId);
}

function buildProfileFromParsedAi(data: any, userId: string): Profile {
  const now = new Date().toISOString();
  const personal = data.personalInfo || {};

  const summaries: SummaryVersion[] = Array.isArray(data.summaries) && data.summaries.length > 0
    ? data.summaries.map((s: any, idx: number) => ({
        id: `sum-${Date.now()}-${idx}`,
        title: s.title || (idx === 0 ? 'Professional Summary' : `Summary ${idx + 1}`),
        content: s.content || '',
        isDefault: idx === 0,
        createdAt: now,
      }))
    : [];

  const skills: SkillItem[] = Array.isArray(data.skills)
    ? data.skills
        .filter((s: any) => s && s.name && typeof s.name === 'string')
        .map((s: any, idx: number) => ({
          id: `sk-${Date.now()}-${idx}`,
          name: s.name.trim(),
          category: normalizeCategory(s.category),
          proficiency: s.proficiency || 'Advanced',
          aliases: Array.isArray(s.aliases) ? s.aliases.map((a: any) => String(a).trim()).filter(Boolean) : [],
          isVerified: true,
        }))
    : [];

  const experiences: ExperienceItem[] = Array.isArray(data.experiences)
    ? data.experiences
        .filter((e: any) => e && (e.company || e.jobTitle))
        .map((e: any, idx: number) => {
          const respBullets = Array.isArray(e.responsibilities)
            ? e.responsibilities
                .map((r: any, rIdx: number) => ({
                  id: `exp-${Date.now()}-${idx}-resp-${rIdx}`,
                  text: typeof r === 'string' ? r : (r.text || ''),
                  isVerified: true,
                }))
                .filter((b: any) => b.text.trim().length > 0)
            : [];

          const achBullets = Array.isArray(e.achievements)
            ? e.achievements
                .map((a: any, aIdx: number) => ({
                  id: `exp-${Date.now()}-${idx}-ach-${aIdx}`,
                  text: typeof a === 'string' ? a : (a.text || ''),
                  isVerified: true,
                }))
                .filter((b: any) => b.text.trim().length > 0)
            : [];

          return {
            id: `exp-${Date.now()}-${idx}`,
            company: e.company || 'Company',
            jobTitle: e.jobTitle || 'Role',
            employmentType: e.employmentType || 'Full-time',
            startDate: e.startDate || '',
            endDate: e.endDate || 'Present',
            isCurrent: Boolean(e.isCurrent || (e.endDate && e.endDate.toLowerCase().includes('present'))),
            location: e.location || '',
            responsibilities: respBullets,
            achievements: achBullets,
            technologies: Array.isArray(e.technologies) ? e.technologies.map(String).filter(Boolean) : [],
            isVerified: true,
          };
        })
    : [];

  const projects: ProjectItem[] = Array.isArray(data.projects)
    ? data.projects
        .filter((p: any) => p && p.title)
        .map((p: any, idx: number) => {
          const bullets = Array.isArray(p.bullets)
            ? p.bullets
                .map((b: any, bIdx: number) => ({
                  id: `proj-${Date.now()}-${idx}-b-${bIdx}`,
                  text: typeof b === 'string' ? b : (b.text || ''),
                  isVerified: true,
                }))
                .filter((b: any) => b.text.trim().length > 0)
            : [];

          return {
            id: `proj-${Date.now()}-${idx}`,
            title: p.title || 'Project',
            description: p.description || '',
            technologies: Array.isArray(p.technologies) ? p.technologies.map(String).filter(Boolean) : [],
            githubUrl: p.githubUrl || '',
            liveUrl: p.liveUrl || '',
            duration: p.duration || '',
            bullets,
            achievements: [],
            keywords: Array.isArray(p.keywords) ? p.keywords.map(String).filter(Boolean) : [],
            isVerified: true,
          };
        })
    : [];

  const education: EducationItem[] = Array.isArray(data.education)
    ? data.education
        .filter((ed: any) => ed && (ed.institution || ed.degree))
        .map((ed: any, idx: number) => ({
          id: `edu-${Date.now()}-${idx}`,
          institution: ed.institution || 'University',
          degree: ed.degree || 'Degree',
          branch: ed.branch || '',
          startYear: ed.startYear || '',
          graduationYear: ed.graduationYear || '',
          cgpaOrPercentage: ed.cgpaOrPercentage || '',
          additionalInfo: ed.additionalInfo || '',
        }))
    : [];

  const certifications: CertificationItem[] = Array.isArray(data.certifications)
    ? data.certifications
        .filter((c: any) => c && c.name)
        .map((c: any, idx: number) => ({
          id: `cert-${Date.now()}-${idx}`,
          name: c.name || 'Certification',
          issuingOrg: c.issuingOrg || '',
          issueDate: c.issueDate || '',
          expirationDate: c.expirationDate || '',
          credentialId: c.credentialId || '',
          credentialUrl: c.credentialUrl || '',
          description: c.description || '',
        }))
    : [];

  const achievements: AchievementItem[] = Array.isArray(data.achievements)
    ? data.achievements
        .filter((a: any) => a && a.title)
        .map((a: any, idx: number) => ({
          id: `ach-${Date.now()}-${idx}`,
          title: a.title || 'Achievement',
          date: a.date || '',
          description: a.description || '',
        }))
    : [];

  return {
    id: `prof_${userId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
    userId,
    personalInfo: {
      fullName: personal.fullName || '',
      email: personal.email || '',
      phone: personal.phone || '',
      location: personal.location || '',
      linkedinUrl: personal.linkedinUrl || '',
      githubUrl: personal.githubUrl || '',
      portfolioUrl: personal.portfolioUrl || '',
      otherLinks: Array.isArray(personal.otherLinks) ? personal.otherLinks : [],
    },
    summaries,
    skills,
    experiences,
    projects,
    education,
    certifications,
    achievements,
    updatedAt: now,
  };
}

/**
 * Robust heuristic extraction engine for offline or fallback environments.
 */
export function extractProfileHeuristically(rawText: string, userId = 'usr_imported'): Profile {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const now = new Date().toISOString();

  // Contact regex extractions
  const emailMatch = rawText.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i);
  const githubMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i);
  const portfolioMatch = rawText.match(/(?:https?:\/\/)?[\w.-]+\.(?:vercel\.app|netlify\.app|github\.io|me|dev|io)/i);

  // Name extraction from top candidate lines
  let detectedName = '';
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i];
    if (
      !line.includes('@') &&
      !line.includes('http') &&
      !line.includes('linkedin.com') &&
      !line.includes('github.com') &&
      !line.toLowerCase().includes('resume') &&
      !line.toLowerCase().includes('curriculum vitae') &&
      !line.toLowerCase().includes('software engineer') &&
      line.length > 2 &&
      line.length < 40 &&
      /^[a-zA-Z\s.'-]+$/.test(line)
    ) {
      detectedName = line;
      break;
    }
  }

  // Location heuristic
  let detectedLocation = '';
  const locationMatch = rawText.match(/\b([A-Z][a-zA-Z\s]+,\s*[A-Z]{2,}|[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+(?:,\s*[A-Z][a-zA-Z\s]+)?)\b/);
  if (locationMatch && !locationMatch[0].toLowerCase().includes('university') && !locationMatch[0].toLowerCase().includes('college')) {
    detectedLocation = locationMatch[0].trim();
  }

  // Common technical dictionary with category mapping
  const TECH_CATEGORIES: { name: string; category: SkillCategory; aliases?: string[] }[] = [
    // Programming Languages
    { name: 'JavaScript', category: 'Programming Languages', aliases: ['JS', 'ES6'] },
    { name: 'TypeScript', category: 'Programming Languages', aliases: ['TS'] },
    { name: 'Python', category: 'Programming Languages' },
    { name: 'Java', category: 'Programming Languages', aliases: ['Core Java'] },
    { name: 'C++', category: 'Programming Languages' },
    { name: 'C#', category: 'Programming Languages' },
    { name: 'Go', category: 'Programming Languages', aliases: ['Golang'] },
    { name: 'Rust', category: 'Programming Languages' },
    { name: 'PHP', category: 'Programming Languages' },
    { name: 'Ruby', category: 'Programming Languages' },
    { name: 'HTML5', category: 'Programming Languages', aliases: ['HTML'] },
    { name: 'CSS3', category: 'Programming Languages', aliases: ['CSS'] },
    { name: 'SQL', category: 'Programming Languages' },
    // Frontend
    { name: 'React.js', category: 'Frontend Technologies', aliases: ['React', 'ReactJS'] },
    { name: 'Next.js', category: 'Frontend Technologies', aliases: ['NextJS', 'Next'] },
    { name: 'Vue.js', category: 'Frontend Technologies', aliases: ['Vue'] },
    { name: 'Angular', category: 'Frontend Technologies' },
    { name: 'Tailwind CSS', category: 'Frontend Technologies', aliases: ['Tailwind'] },
    { name: 'Redux', category: 'Frontend Technologies', aliases: ['Redux Toolkit'] },
    { name: 'Zustand', category: 'Frontend Technologies' },
    // Backend
    { name: 'Node.js', category: 'Backend Technologies', aliases: ['Node'] },
    { name: 'Express.js', category: 'Backend Technologies', aliases: ['Express'] },
    { name: 'Spring Boot', category: 'Backend Technologies', aliases: ['SpringBoot'] },
    { name: 'Django', category: 'Backend Technologies' },
    { name: 'Flask', category: 'Backend Technologies' },
    { name: 'FastAPI', category: 'Backend Technologies' },
    { name: 'REST APIs', category: 'Backend Technologies', aliases: ['RESTful APIs', 'REST'] },
    { name: 'GraphQL', category: 'Backend Technologies' },
    { name: 'Microservices', category: 'Backend Technologies' },
    // Databases
    { name: 'PostgreSQL', category: 'Databases', aliases: ['Postgres'] },
    { name: 'MySQL', category: 'Databases' },
    { name: 'MongoDB', category: 'Databases', aliases: ['Mongo'] },
    { name: 'Redis', category: 'Databases' },
    { name: 'SQLite', category: 'Databases' },
    { name: 'Oracle SQL', category: 'Databases' },
    // Developer Tools & Cloud
    { name: 'Git', category: 'Developer Tools' },
    { name: 'GitHub', category: 'Developer Tools' },
    { name: 'Docker', category: 'Developer Tools' },
    { name: 'Kubernetes', category: 'Developer Tools', aliases: ['K8s'] },
    { name: 'AWS', category: 'Cloud Platforms', aliases: ['Amazon Web Services'] },
    { name: 'Google Cloud Platform', category: 'Cloud Platforms', aliases: ['GCP'] },
    { name: 'Microsoft Azure', category: 'Cloud Platforms', aliases: ['Azure'] },
    { name: 'CI/CD', category: 'Developer Tools', aliases: ['GitLab CI/CD', 'GitHub Actions'] },
    // Testing
    { name: 'Jest', category: 'Testing Tools' },
    { name: 'JUnit', category: 'Testing Tools' },
    { name: 'Playwright', category: 'Testing Tools' },
    { name: 'Cypress', category: 'Testing Tools' },
  ];

  const extractedSkills: SkillItem[] = [];
  const foundNames = new Set<string>();

  for (const item of TECH_CATEGORIES) {
    const escaped = item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(rawText) && !foundNames.has(item.name.toLowerCase())) {
      foundNames.add(item.name.toLowerCase());
      extractedSkills.push({
        id: `sk-${Date.now()}-${extractedSkills.length}`,
        name: item.name,
        category: item.category,
        proficiency: 'Advanced',
        aliases: item.aliases || [],
        isVerified: true,
      });
    }
  }

  // Education heuristic
  const education: EducationItem[] = [];
  const eduKeywords = ['Bachelor', 'Master', 'B.E.', 'B.Tech', 'B.S.', 'M.S.', 'M.Tech', 'Degree', 'University', 'Institute'];
  for (const line of lines) {
    if (eduKeywords.some((k) => line.toLowerCase().includes(k.toLowerCase()))) {
      const yearMatch = line.match(/\b(20\d{2})\b/g);
      education.push({
        id: `edu-${Date.now()}-${education.length}`,
        institution: line.length < 80 ? line : line.slice(0, 80),
        degree: 'Higher Education Degree',
        branch: '',
        startYear: yearMatch && yearMatch[0] ? yearMatch[0] : '',
        graduationYear: yearMatch && yearMatch[1] ? yearMatch[1] : (yearMatch && yearMatch[0] ? yearMatch[0] : ''),
        cgpaOrPercentage: '',
      });
      break; // Pick the primary education line
    }
  }

  // Summary heuristic
  const summaries: SummaryVersion[] = [];
  const summaryHeaderIdx = lines.findIndex((l) => /^(professional summary|summary|about me|profile)/i.test(l));
  if (summaryHeaderIdx !== -1 && lines[summaryHeaderIdx + 1]) {
    summaries.push({
      id: `sum-${Date.now()}-0`,
      title: 'Professional Summary',
      content: lines[summaryHeaderIdx + 1],
      isDefault: true,
      createdAt: now,
    });
  }

  return {
    id: `prof_${userId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
    userId,
    personalInfo: {
      fullName: detectedName,
      email: emailMatch ? emailMatch[0] : '',
      phone: phoneMatch ? phoneMatch[0] : '',
      location: detectedLocation,
      linkedinUrl: linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : '',
      githubUrl: githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : '',
      portfolioUrl: portfolioMatch ? (portfolioMatch[0].startsWith('http') ? portfolioMatch[0] : `https://${portfolioMatch[0]}`) : '',
      otherLinks: [],
    },
    summaries,
    skills: extractedSkills,
    experiences: [],
    projects: [],
    education,
    certifications: [],
    achievements: [],
    updatedAt: now,
  };
}
