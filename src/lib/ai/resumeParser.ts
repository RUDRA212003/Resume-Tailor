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

export function normalizeCategory(cat?: string): SkillCategory {
  if (!cat) return 'Other Skills';
  const trimmed = cat.trim();
  if (VALID_CATEGORIES.has(trimmed as SkillCategory)) {
    return trimmed as SkillCategory;
  }
  const lower = trimmed.toLowerCase();
  const cleaned = lower.replace(/[\s\-_]/g, '');

  if (cleaned.includes('language') || cleaned.includes('programming')) return 'Programming Languages';
  if (cleaned.includes('frontend') || cleaned.includes('front') || cleaned.includes('ui') || cleaned.includes('web')) return 'Frontend Technologies';
  if (cleaned.includes('backend') || cleaned.includes('back') || cleaned.includes('server') || cleaned.includes('api')) return 'Backend Technologies';
  if (cleaned.includes('database') || cleaned.includes('storage') || cleaned.includes('sql') || cleaned.includes('nosql') || cleaned === 'db') return 'Databases';
  if (cleaned.includes('cloud') || cleaned.includes('devops') || cleaned.includes('aws') || cleaned.includes('azure') || cleaned.includes('gcp')) return 'Cloud Platforms';
  if (cleaned.includes('framework') || cleaned.includes('library')) return 'Frameworks and Libraries';
  if (cleaned.includes('tool') || cleaned.includes('devtool') || cleaned.includes('versioncontrol')) return 'Developer Tools';
  if (cleaned.includes('test') || cleaned.includes('qa')) return 'Testing Tools';

  return 'Other Skills';
}

/**
 * Intelligent categorization of raw pasted skill text with headings.
 * Handles patterns like:
 * "Programming Languages: Java, Python, C++
 * Databases: PostgreSQL, MongoDB
 * Tools: Git, Docker"
 */
export function parseAndCategorizeSkillsText(rawText: string): SkillItem[] {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const results: SkillItem[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    // Check if line has a heading pattern e.g. "Heading: skill1, skill2, skill3"
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0 && colonIdx < 45) {
      const heading = line.slice(0, colonIdx).trim();
      const category = normalizeCategory(heading);
      const skillsPart = line.slice(colonIdx + 1).trim();
      const skillTokens = skillsPart.split(/[,;|•·]/).map((s) => s.trim()).filter(Boolean);

      for (const token of skillTokens) {
        if (token && !seen.has(token.toLowerCase())) {
          seen.add(token.toLowerCase());
          results.push({
            id: `sk-${Date.now()}-${results.length}`,
            name: token,
            category,
            proficiency: 'Advanced',
            aliases: [],
            isVerified: true,
          });
        }
      }
    } else {
      // Freeform comma-separated skills without explicit heading
      const tokens = line.split(/[,;|•·]/).map((s) => s.trim()).filter(Boolean);
      for (const token of tokens) {
        if (token && !seen.has(token.toLowerCase())) {
          seen.add(token.toLowerCase());
          results.push({
            id: `sk-${Date.now()}-${results.length}`,
            name: token,
            category: detectSkillCategory(token),
            proficiency: 'Advanced',
            aliases: [],
            isVerified: true,
          });
        }
      }
    }
  }

  return results;
}

export function detectSkillCategory(skillName: string): SkillCategory {
  const lower = skillName.toLowerCase();
  const pl = ['java', 'javascript', 'typescript', 'python', 'c++', 'c#', 'c', 'go', 'golang', 'rust', 'php', 'ruby', 'kotlin', 'swift', 'scala', 'r', 'dart', 'html', 'html5', 'css', 'css3', 'sql'];
  const fe = ['react', 'react.js', 'reactjs', 'next.js', 'nextjs', 'next', 'vue', 'vue.js', 'angular', 'svelte', 'tailwind', 'tailwind css', 'redux', 'zustand', 'styled components', 'bootstrap', 'jquery', 'react query'];
  const be = ['spring boot', 'springboot', 'spring', 'node.js', 'nodejs', 'express', 'express.js', 'django', 'flask', 'fastapi', 'rest', 'rest api', 'rest apis', 'restful apis', 'graphql', 'microservices', 'grpc', 'kafka', 'rabbitmq'];
  const db = ['postgresql', 'postgres', 'mysql', 'mongodb', 'mongo', 'redis', 'sqlite', 'oracle', 'oracle sql', 'cassandra', 'dynamodb', 'elasticsearch', 'mariadb', 'supabase', 'firebase'];
  const cloud = ['aws', 'amazon web services', 'azure', 'microsoft azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s', 'terraform', 'ansible'];
  const tools = ['git', 'github', 'gitlab', 'gitlab ci/cd', 'ci/cd', 'postman', 'jira', 'talend', 'spinnaker', 'putty', 'winscp', 'jenkins', 'linux', 'webpack', 'vite', 'npm', 'pnpm', 'yarn'];
  const testing = ['junit', 'jest', 'mocha', 'chai', 'cypress', 'playwright', 'selenium', 'unit testing', 'functional testing', 'integration testing'];

  if (pl.includes(lower)) return 'Programming Languages';
  if (fe.includes(lower)) return 'Frontend Technologies';
  if (be.includes(lower)) return 'Backend Technologies';
  if (db.includes(lower)) return 'Databases';
  if (cloud.includes(lower)) return 'Cloud Platforms';
  if (tools.includes(lower)) return 'Developer Tools';
  if (testing.includes(lower)) return 'Testing Tools';

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
    const modelsToTry = [getResolvedModel(), 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];
    for (const model of modelsToTry) {
      try {
        const prompt = `
You are an expert AI resume parser. Extract the candidate's complete professional profile from the resume text into a structured JSON object.
Extract all personalInfo (fullName, email, phone, location, linkedinUrl, githubUrl, portfolioUrl), summaries, skills (name, category, proficiency), experiences (company, jobTitle, startDate, endDate, isCurrent, location, responsibilities, achievements, technologies), projects (title, description, technologies, bullets), education (institution, degree, branch, startYear, graduationYear, cgpaOrPercentage), and certifications.

RESUME TEXT:
${rawText.slice(0, 8000)}

Respond ONLY with valid JSON:
{
  "personalInfo": { "fullName": "", "email": "", "phone": "", "location": "", "linkedinUrl": "", "githubUrl": "", "portfolioUrl": "" },
  "summaries": [{ "title": "Professional Summary", "content": "" }],
  "skills": [{ "name": "Java", "category": "Programming Languages", "proficiency": "Advanced", "aliases": [] }],
  "experiences": [{ "company": "", "jobTitle": "", "employmentType": "Full-time", "startDate": "", "endDate": "", "isCurrent": false, "location": "", "responsibilities": [""], "achievements": [""], "technologies": [""] }],
  "projects": [{ "title": "", "description": "", "technologies": [""], "bullets": [""], "duration": "" }],
  "education": [{ "institution": "", "degree": "", "branch": "", "startYear": "", "graduationYear": "", "cgpaOrPercentage": "" }],
  "certifications": [{ "name": "", "issuingOrg": "", "issueDate": "" }]
}
`;

        const response = await gemini.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        const responseText = response.text?.trim() || '{}';
        const parsed = JSON.parse(responseText);

        const profile = buildProfileFromParsedAi(parsed, userId);
        if (profile.personalInfo.fullName || profile.skills.length > 0 || profile.experiences.length > 0) {
          return profile;
        }
      } catch (err: any) {
        console.warn(`Gemini parse attempt with ${model} note:`, err.message || err);
      }
    }
  }

  // Robust comprehensive heuristic rule engine for PDF/DOCX text
  return extractProfileHeuristically(rawText, userId);
}

function buildProfileFromParsedAi(data: any, userId: string): Profile {
  const now = new Date().toISOString();
  const personal = data.personalInfo || {};

  const summaries: SummaryVersion[] = Array.isArray(data.summaries) && data.summaries.length > 0
    ? data.summaries
        .filter((s: any) => s && (s.content || s.title))
        .map((s: any, idx: number) => ({
          id: `sum-${Date.now()}-${idx}`,
          title: s.title || (idx === 0 ? 'Professional Summary' : `Summary ${idx + 1}`),
          content: s.content || s.title || '',
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
    achievements: [],
    updatedAt: now,
  };
}

/**
 * Robust heuristic extraction engine for PDF/DOCX documents.
 * Accurately parses personal details, summaries, skills, work experience, projects, and education.
 */
export function extractProfileHeuristically(rawText: string, userId = 'usr_imported'): Profile {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const now = new Date().toISOString();

  // 1. Personal Info Extraction
  // Clean phone regex: e.g. +91 6364152219, (555) 123-4567, etc.
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,5}[\s-]?\d{4,5}/);
  const detectedPhone = phoneMatch ? phoneMatch[0].trim() : '';

  // Clean email regex: match real email without concatenated words or trailing labels
  const emailMatch = rawText.match(/([a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+?\.(?:com|org|net|edu|gov|io|co|in|dev|ai|me))(?=[A-Z\s,;]|$)/);
  const detectedEmail = emailMatch ? emailMatch[1].trim() : '';

  // Clean links
  const linkedinMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i);
  const githubMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i);
  const portfolioMatch = rawText.match(/(?:https?:\/\/)?[\w.-]+\.(?:vercel\.app|netlify\.app|github\.io|me|dev|io)/i);

  // Full Name: candidate's name is typically on line 1 or line 2
  let detectedName = '';
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    if (
      !line.includes('@') &&
      !line.includes('http') &&
      !line.includes('+') &&
      !line.toLowerCase().includes('resume') &&
      !line.toLowerCase().includes('curriculum vitae') &&
      !line.toLowerCase().includes('summary') &&
      line.length >= 2 &&
      line.length <= 40 &&
      /^[a-zA-Z\s.'-]+$/.test(line)
    ) {
      detectedName = line.trim();
      break;
    }
  }

  // 2. Section Partitioning
  const sectionHeaders: { type: string; lineIdx: number }[] = [];
  const headerPatterns = [
    { type: 'SUMMARY', regex: /^(professional summary|summary|about me|career objective|profile)$/i },
    { type: 'SKILLS', regex: /^(technical skills|skills|core competencies|technologies)$/i },
    { type: 'EXPERIENCE', regex: /^(professional experience|work experience|experience|employment history)$/i },
    { type: 'PROJECTS', regex: /^(key projects|projects|academic projects|technical projects)$/i },
    { type: 'EDUCATION', regex: /^(education|academic background|qualifications)$/i },
    { type: 'CERTIFICATIONS', regex: /^(certifications|licenses|certifications & accreditations)$/i },
  ];

  lines.forEach((line, idx) => {
    for (const h of headerPatterns) {
      if (h.regex.test(line)) {
        sectionHeaders.push({ type: h.type, lineIdx: idx });
        break;
      }
    }
  });

  const getSectionLines = (type: string): string[] => {
    const targetIdx = sectionHeaders.findIndex((s) => s.type === type);
    if (targetIdx === -1) return [];
    const start = sectionHeaders[targetIdx].lineIdx + 1;
    const end = targetIdx + 1 < sectionHeaders.length ? sectionHeaders[targetIdx + 1].lineIdx : lines.length;
    return lines.slice(start, end);
  };

  // 3. Summaries Extraction
  const summaries: SummaryVersion[] = [];
  const summaryLines = getSectionLines('SUMMARY');
  if (summaryLines.length > 0) {
    const summaryText = summaryLines.join(' ');
    summaries.push({
      id: `sum-${Date.now()}-0`,
      title: 'Professional Summary',
      content: summaryText,
      isDefault: true,
      createdAt: now,
    });
  }

  // 4. Skills Extraction
  const skillLines = getSectionLines('SKILLS');
  let extractedSkills: SkillItem[] = [];
  if (skillLines.length > 0) {
    extractedSkills = parseAndCategorizeSkillsText(skillLines.join('\n'));
  }

  // If section was empty or missed skills, scan entire text for known technical skills
  if (extractedSkills.length === 0) {
    extractedSkills = parseAndCategorizeSkillsText(rawText);
  }

  // 5. Experience Extraction
  const experiences: ExperienceItem[] = [];
  const expLines = getSectionLines('EXPERIENCE');
  if (expLines.length > 0) {
    let currentExp: Partial<ExperienceItem> | null = null;
    let bullets: { id: string; text: string; isVerified: boolean }[] = [];

    const dateRangeRegex = /\b(20\d{2}[-\/.]\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+20\d{2}|20\d{2})\s*(?:[–—\-]|to)\s*(20\d{2}[-\/.]\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+20\d{2}|20\d{2}|Present)\b/i;

    for (let i = 0; i < expLines.length; i++) {
      const line = expLines[i];
      const dateMatch = line.match(dateRangeRegex);

      if (dateMatch && i > 0) {
        // Line before date is usually company or title
        if (currentExp && currentExp.company) {
          experiences.push({
            id: `exp-${Date.now()}-${experiences.length}`,
            company: currentExp.company || 'Company',
            jobTitle: currentExp.jobTitle || 'Software Engineer',
            employmentType: 'Full-time',
            startDate: currentExp.startDate || '',
            endDate: currentExp.endDate || 'Present',
            isCurrent: Boolean(currentExp.endDate?.toLowerCase().includes('present')),
            location: currentExp.location || '',
            responsibilities: bullets,
            achievements: [],
            technologies: currentExp.technologies || [],
            isVerified: true,
          });
          bullets = [];
        }

        const companyCandidate = expLines[i - 1];
        const nextLine = expLines[i + 1] || '';
        const locationCandidate = expLines[i + 2] || '';

        currentExp = {
          company: companyCandidate,
          jobTitle: nextLine && !nextLine.startsWith('•') ? nextLine : 'Engineer',
          startDate: dateMatch[1] || '',
          endDate: dateMatch[2] || 'Present',
          location: locationCandidate && !locationCandidate.startsWith('•') ? locationCandidate : '',
          technologies: [],
        };
      } else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        // Bullet point
        const text = line.replace(/^[•\-*]\s*/, '').trim();
        if (text) {
          bullets.push({
            id: `exp-${Date.now()}-${experiences.length}-b-${bullets.length}`,
            text,
            isVerified: true,
          });
        }
      } else if (line.length > 20 && !dateMatch && currentExp) {
        // Possible multi-line or non-bulleted sentence
        if (!line.includes(':') && line.split(' ').length > 4) {
          bullets.push({
            id: `exp-${Date.now()}-${experiences.length}-b-${bullets.length}`,
            text: line,
            isVerified: true,
          });
        }
      }
    }

    if (currentExp && currentExp.company) {
      experiences.push({
        id: `exp-${Date.now()}-${experiences.length}`,
        company: currentExp.company || 'Company',
        jobTitle: currentExp.jobTitle || 'Software Engineer',
        employmentType: 'Full-time',
        startDate: currentExp.startDate || '',
        endDate: currentExp.endDate || 'Present',
        isCurrent: Boolean(currentExp.endDate?.toLowerCase().includes('present')),
        location: currentExp.location || '',
        responsibilities: bullets,
        achievements: [],
        technologies: currentExp.technologies || [],
        isVerified: true,
      });
    }
  }

  // 6. Projects Extraction
  const projects: ProjectItem[] = [];
  const projectLines = getSectionLines('PROJECTS');
  if (projectLines.length > 0) {
    let currentProj: Partial<ProjectItem> | null = null;
    let projBullets: { id: string; text: string; isVerified: boolean }[] = [];

    for (let i = 0; i < projectLines.length; i++) {
      const line = projectLines[i];
      if (line.includes('–') || line.includes(' - ') || line.toLowerCase().includes('technologies:')) {
        if (line.toLowerCase().startsWith('technologies:') && currentProj) {
          const techStr = line.replace(/^technologies:\s*/i, '');
          currentProj.technologies = techStr.split(/[,;|]/).map((t) => t.trim()).filter(Boolean);
          continue;
        }

        // Project Title line e.g. "Career Mock – AI-Powered Voice Interview Platform"
        if (!line.startsWith('•') && !line.startsWith('-')) {
          if (currentProj && currentProj.title) {
            projects.push({
              id: `proj-${Date.now()}-${projects.length}`,
              title: currentProj.title,
              description: currentProj.description || '',
              technologies: currentProj.technologies || [],
              duration: currentProj.duration || '',
              bullets: projBullets,
              achievements: [],
              keywords: [],
              isVerified: true,
            });
            projBullets = [];
          }

          currentProj = {
            title: line,
            technologies: [],
          };
          continue;
        }
      }

      if (line.startsWith('•') || line.startsWith('-')) {
        const text = line.replace(/^[•\-]\s*/, '').trim();
        if (text) {
          projBullets.push({
            id: `proj-${Date.now()}-${projects.length}-b-${projBullets.length}`,
            text,
            isVerified: true,
          });
        }
      } else if (currentProj && !currentProj.description && line.length > 30) {
        currentProj.description = line;
      }
    }

    if (currentProj && currentProj.title) {
      projects.push({
        id: `proj-${Date.now()}-${projects.length}`,
        title: currentProj.title,
        description: currentProj.description || '',
        technologies: currentProj.technologies || [],
        duration: currentProj.duration || '',
        bullets: projBullets,
        achievements: [],
        keywords: [],
        isVerified: true,
      });
    }
  }

  // 7. Education Extraction
  const education: EducationItem[] = [];
  const eduLines = getSectionLines('EDUCATION');
  if (eduLines.length > 0) {
    let degree = '';
    let institution = '';
    let startYear = '';
    let graduationYear = '';
    let score = '';

    for (const line of eduLines) {
      const yearMatch = line.match(/\b(20\d{2})\s*(?:–|—|-|to)\s*(20\d{2})\b/);
      if (yearMatch) {
        startYear = yearMatch[1];
        graduationYear = yearMatch[2];
      } else if (line.toLowerCase().includes('bachelor') || line.toLowerCase().includes('master') || line.toLowerCase().includes('b.e.') || line.toLowerCase().includes('b.tech') || line.toLowerCase().includes('degree')) {
        degree = line;
      } else if (line.toLowerCase().includes('institute') || line.toLowerCase().includes('university') || line.toLowerCase().includes('college')) {
        institution = line;
      } else if (line.toLowerCase().includes('score') || line.toLowerCase().includes('cgpa') || line.toLowerCase().includes('gpa')) {
        score = line.replace(/^(score|cgpa|gpa):\s*/i, '');
      }
    }

    if (institution || degree) {
      education.push({
        id: `edu-${Date.now()}-0`,
        institution: institution || 'Institution',
        degree: degree || 'Bachelor of Engineering',
        branch: degree.includes(' in ') ? degree.split(' in ')[1] : '',
        startYear: startYear || '2022',
        graduationYear: graduationYear || '2026',
        cgpaOrPercentage: score || '',
      });
    }
  }

  // Location fallback from experiences or education
  let detectedLocation = '';
  if (experiences.length > 0 && experiences[0].location) {
    detectedLocation = experiences[0].location;
  }

  return {
    id: `prof_${userId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
    userId,
    personalInfo: {
      fullName: detectedName,
      email: detectedEmail,
      phone: detectedPhone,
      location: detectedLocation,
      linkedinUrl: linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : '',
      githubUrl: githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : '',
      portfolioUrl: portfolioMatch ? (portfolioMatch[0].startsWith('http') ? portfolioMatch[0] : `https://${portfolioMatch[0]}`) : '',
      otherLinks: [],
    },
    summaries,
    skills: extractedSkills,
    experiences,
    projects,
    education,
    certifications: [],
    achievements: [],
    updatedAt: now,
  };
}
