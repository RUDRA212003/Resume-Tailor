export type SkillCategory =
  | 'Programming Languages'
  | 'Frontend Technologies'
  | 'Backend Technologies'
  | 'Databases'
  | 'Frameworks and Libraries'
  | 'Developer Tools'
  | 'Cloud Platforms'
  | 'Testing Tools'
  | 'Other Skills';

export const SKILL_CATEGORIES: SkillCategory[] = [
  'Programming Languages',
  'Frontend Technologies',
  'Backend Technologies',
  'Databases',
  'Frameworks and Libraries',
  'Developer Tools',
  'Cloud Platforms',
  'Testing Tools',
  'Other Skills',
];

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl?: string;
  otherLinks?: { label: string; url: string }[];
}

export interface SummaryVersion {
  id: string;
  title: string;
  content: string;
  isDefault: boolean;
  createdAt: string;
}

export interface SkillItem {
  id: string;
  name: string;
  category: SkillCategory;
  proficiency?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  aliases: string[];
  isVerified: boolean;
}

export interface ExperienceBullet {
  id: string;
  text: string;
  isVerified: boolean;
}

export interface ExperienceItem {
  id: string;
  company: string;
  jobTitle: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Freelance';
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  location: string;
  responsibilities: ExperienceBullet[];
  achievements: ExperienceBullet[];
  technologies: string[];
  isVerified: boolean;
}

export interface ProjectBullet {
  id: string;
  text: string;
  isVerified: boolean;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  duration?: string;
  bullets: ProjectBullet[];
  achievements: ProjectBullet[];
  keywords: string[];
  isVerified: boolean;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  branch: string;
  startYear: string;
  graduationYear: string;
  cgpaOrPercentage?: string;
  additionalInfo?: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuingOrg: string;
  issueDate: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  date?: string;
  description: string;
}

export interface Profile {
  id: string;
  userId: string;
  userEmail?: string;
  personalInfo: PersonalInfo;
  summaries: SummaryVersion[];
  skills: SkillItem[];
  experiences: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  achievements: AchievementItem[];
  updatedAt: string;
}

export type TemplateLayoutType = 'modern' | 'classic' | 'tech' | 'compact';

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  layoutType: TemplateLayoutType;
  isBuiltIn: boolean;
  isDefault: boolean;
  accentColor: string;
  fontFamily: string;
  sectionsOrder: string[];
  createdAt: string;
}

export interface JobDescription {
  id: string;
  userId?: string;
  companyName: string;
  jobTitle: string;
  location?: string;
  url?: string;
  rawText: string;
  sourceType: 'paste' | 'upload';
  uploadedFileName?: string;
  createdAt: string;
}

export type RequirementMatchStatus =
  | 'available'
  | 'partially_matched'
  | 'not_present'
  | 'requires_confirmation';

export interface AnalyzedSkillRequirement {
  name: string;
  category: string;
  status: RequirementMatchStatus;
  matchedProfileSkill?: string;
  matchedAlias?: string;
  notes?: string;
}

export interface JDAnalysis {
  id: string;
  jobDescriptionId: string;
  roleSummary: string;
  requiredSkills: AnalyzedSkillRequirement[];
  preferredSkills: AnalyzedSkillRequirement[];
  responsibilities: string[];
  qualifications: string[];
  keywords: string[];
  relevanceScore: number; // 0-100 internal relevance estimate
  scoreBreakdown: {
    skillsMatchPercentage: number;
    experienceRelevance: number;
    projectRelevance: number;
    keywordCoverage: number;
    explanation: string;
  };
  recommendations: string[];
  analyzedAt: string;
}

export interface TailoredBullet {
  id: string;
  text: string;
  sourceFactIds: string[];
  originalText?: string;
  isRewritten: boolean;
  rewriteReason?: string;
}

export interface TailoredExperience {
  experienceId: string;
  company: string;
  jobTitle: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  location: string;
  technologies: string[];
  bullets: TailoredBullet[];
}

export interface TailoredProject {
  projectId: string;
  title: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  duration?: string;
  bullets: TailoredBullet[];
}

export interface ValidationReport {
  isValid: boolean;
  checkedFactsCount: number;
  unverifiedSkillsDetected: string[];
  unsupportedClaims: string[];
  warnings: string[];
  timestamp: string;
}

export interface ResumeDiffChange {
  section: 'summary' | 'skills' | 'experience' | 'projects' | 'education';
  type: 'added' | 'removed' | 'rewritten' | 'reordered';
  title: string;
  originalText?: string;
  newText: string;
  reason: string;
}

export interface ResumeDiff {
  addedCount: number;
  omittedCount: number;
  rewrittenCount: number;
  changes: ResumeDiffChange[];
}

export interface TailoredResume {
  id: string;
  userId?: string;
  originalResumeId?: string;
  jobDescriptionId: string;
  templateId: string;
  profileSnapshotId: string;
  title: string;
  summary: string;
  selectedSkills: {
    category: SkillCategory;
    skills: string[];
  }[];
  selectedExperiences: TailoredExperience[];
  selectedProjects: TailoredProject[];
  education: EducationItem[];
  certifications: CertificationItem[];
  achievements: AchievementItem[];
  analysis: JDAnalysis;
  validationReport: ValidationReport;
  diff: ResumeDiff;
  tailoringEngine?: 'gemini-api' | 'heuristic-fallback';
  coverLetter?: any;
  createdAt: string;
  updatedAt: string;
}

export interface SavedApplication {
  id: string;
  userId?: string;
  companyName: string;
  jobTitle: string;
  location?: string;
  jobUrl?: string;
  tailoredResumeId: string;
  jobDescriptionId: string;
  templateId: string;
  relevanceScore: number;
  status: 'Draft' | 'Applied' | 'Interviewing' | 'Offer' | 'Archived';
  notes?: string;
  coverLetter?: any;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  aiProvider: 'gemini' | 'openai' | 'anthropic';
  geminiModel: 'gemini-3.8-flash' | 'gemini-2.5-flash' | 'gemini-1.5-pro';
  apiKeyConfigured: boolean;
  privacyConsentGiven: boolean;
  storageProvider: 'mongodb' | 'supabase' | 'local';
  anonymizePIIInPrompt: boolean;
}

export type UserRole = 'user' | 'admin';

export interface UserRecord {
  auth0Id: string;
  name: string;
  email: string;
  profileImage?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationHistoryItem {
  id: string;
  userId: string;
  action: string;
  relatedDocumentId?: string;
  details?: Record<string, any>;
  createdAt: string;
}
