import type {
  Profile,
  ResumeTemplate,
  JobDescription,
  JDAnalysis,
  TailoredResume,
  SavedApplication,
  UserSettings,
} from '@/types';
import {
  DEFAULT_PROFILE,
  BUILT_IN_TEMPLATES,
  DEFAULT_USER_SETTINGS,
} from './defaultData';

const STORAGE_KEYS = {
  PROFILE: 'resumecraft_profile_v4_rudresh',
  TEMPLATES: 'resumecraft_templates_v3_ats',
  JOB_DESCRIPTIONS: 'resumecraft_jds_v1',
  ANALYSES: 'resumecraft_analyses_v1',
  TAILORED_RESUMES: 'resumecraft_tailored_resumes_v1',
  APPLICATIONS: 'resumecraft_applications_v1',
  SETTINGS: 'resumecraft_settings_v1',
};

// In-memory fallback cache for SSR or node environments
const memoryStore: Record<string, unknown> = {};

function safeGetItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return (memoryStore[key] as T) ?? defaultValue;
  }
  try {
    ['resumecraft_profile_v1', 'resumecraft_profile_v2_rudresh'].forEach((oldKey) => {
      try { localStorage.removeItem(oldKey); } catch (_) {}
    });
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    memoryStore[key] = value;
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

export const repository = {
  // User Profile
  getProfile(): Profile {
    const p = safeGetItem<Profile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
    const hasRudreshVerifiedData =
      p &&
      p.personalInfo &&
      p.personalInfo.fullName === 'RUDRESH M' &&
      Array.isArray(p.experiences) &&
      p.experiences.some((e) => e.company === 'CAE') &&
      Array.isArray(p.projects) &&
      p.projects.some((pr) => pr.title && pr.title.includes('Career Mock'));

    if (!hasRudreshVerifiedData) {
      safeSetItem(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
      return DEFAULT_PROFILE;
    }
    return p;
  },

  cacheProfile(profile: Profile): void {
    safeSetItem(STORAGE_KEYS.PROFILE, profile);
  },

  saveProfile(profile: Profile): Profile {
    const updated = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    safeSetItem(STORAGE_KEYS.PROFILE, updated);
    return updated;
  },

  async syncProfileToDb(profile: Profile): Promise<{ success: boolean; data?: Profile; error?: string }> {
    if (typeof window === 'undefined') return { success: false, error: 'Cannot sync on server' };
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok || data.savedToDb === false) {
        return {
          success: false,
          data,
          error: data.error || data.warning || 'Database write failed. Changes stored in local session.',
        };
      }
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error syncing with MongoDB' };
    }
  },

  resetProfile(): Profile {
    safeSetItem(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
    return DEFAULT_PROFILE;
  },

  // Templates
  getTemplates(): ResumeTemplate[] {
    const tmpls = safeGetItem<ResumeTemplate[]>(
      STORAGE_KEYS.TEMPLATES,
      BUILT_IN_TEMPLATES
    );
    if (
      !Array.isArray(tmpls) ||
      !tmpls.some((t) => t.id === 'tmpl-ats-verified') ||
      !tmpls.some((t) => t.id === 'tmpl-single-page-ats')
    ) {
      safeSetItem(STORAGE_KEYS.TEMPLATES, BUILT_IN_TEMPLATES);
      return BUILT_IN_TEMPLATES;
    }
    return tmpls;
  },

  getTemplateById(id: string): ResumeTemplate | undefined {
    const templates = this.getTemplates();
    return templates.find((t) => t.id === id);
  },

  saveTemplate(template: ResumeTemplate): ResumeTemplate {
    const templates = this.getTemplates();
    const index = templates.findIndex((t) => t.id === template.id);
    let updated: ResumeTemplate[];
    if (index >= 0) {
      updated = [...templates];
      updated[index] = template;
    } else {
      updated = [...templates, template];
    }
    safeSetItem(STORAGE_KEYS.TEMPLATES, updated);
    return template;
  },

  setDefaultTemplate(id: string): ResumeTemplate[] {
    const templates = this.getTemplates().map((t) => ({
      ...t,
      isDefault: t.id === id,
    }));
    safeSetItem(STORAGE_KEYS.TEMPLATES, templates);
    return templates;
  },

  deleteTemplate(id: string): boolean {
    const templates = this.getTemplates();
    const target = templates.find((t) => t.id === id);
    if (!target || target.isBuiltIn) return false;
    const filtered = templates.filter((t) => t.id !== id);
    safeSetItem(STORAGE_KEYS.TEMPLATES, filtered);
    return true;
  },

  // Job Descriptions
  getJobDescriptions(): JobDescription[] {
    return safeGetItem<JobDescription[]>(STORAGE_KEYS.JOB_DESCRIPTIONS, []);
  },

  getJobDescriptionById(id: string): JobDescription | undefined {
    return this.getJobDescriptions().find((jd) => jd.id === id);
  },

  saveJobDescription(jd: JobDescription): JobDescription {
    const list = this.getJobDescriptions();
    const index = list.findIndex((item) => item.id === jd.id);
    let updated: JobDescription[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = jd;
    } else {
      updated = [jd, ...list];
    }
    safeSetItem(STORAGE_KEYS.JOB_DESCRIPTIONS, updated);

    // Sync to MongoDB Atlas asynchronously
    if (typeof window !== 'undefined') {
      fetch('/api/job-descriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jd),
      }).catch((e) => console.error('Error syncing JD to DB:', e));
    }

    return jd;
  },

  async syncJobDescriptionsFromDb(): Promise<JobDescription[]> {
    if (typeof window === 'undefined') return this.getJobDescriptions();
    try {
      const res = await fetch('/api/job-descriptions');
      if (!res.ok) return this.getJobDescriptions();
      const data = await res.json();
      if (Array.isArray(data.jobDescriptions)) {
        const local = this.getJobDescriptions();
        const map = new Map<string, JobDescription>();
        local.forEach((j) => map.set(j.id, j));
        data.jobDescriptions.forEach((j: JobDescription) => map.set(j.id, j));
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        safeSetItem(STORAGE_KEYS.JOB_DESCRIPTIONS, merged);
        return merged;
      }
    } catch (_) {}
    return this.getJobDescriptions();
  },

  // Tailored Resumes
  getTailoredResumes(): TailoredResume[] {
    return safeGetItem<TailoredResume[]>(STORAGE_KEYS.TAILORED_RESUMES, []);
  },

  getTailoredResumeById(id: string): TailoredResume | undefined {
    return this.getTailoredResumes().find((r) => r.id === id);
  },

  saveTailoredResume(resume: TailoredResume): TailoredResume {
    const list = this.getTailoredResumes();
    const index = list.findIndex((r) => r.id === resume.id);
    let updated: TailoredResume[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = resume;
    } else {
      updated = [resume, ...list];
    }
    safeSetItem(STORAGE_KEYS.TAILORED_RESUMES, updated);

    // Sync to MongoDB Atlas asynchronously
    if (typeof window !== 'undefined') {
      fetch('/api/tailored-resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resume),
      }).catch((e) => console.error('Error syncing tailored resume to DB:', e));
    }

    return resume;
  },

  deleteTailoredResume(id: string): boolean {
    const list = this.getTailoredResumes();
    const filtered = list.filter((r) => r.id !== id);
    safeSetItem(STORAGE_KEYS.TAILORED_RESUMES, filtered);

    if (typeof window !== 'undefined') {
      fetch(`/api/tailored-resumes/${id}`, { method: 'DELETE' }).catch((e) =>
        console.error('Error deleting tailored resume from DB:', e)
      );
    }

    return true;
  },

  async syncTailoredResumesFromDb(): Promise<TailoredResume[]> {
    if (typeof window === 'undefined') return this.getTailoredResumes();
    try {
      const res = await fetch('/api/tailored-resumes');
      if (!res.ok) return this.getTailoredResumes();
      const data = await res.json();
      if (Array.isArray(data.resumes)) {
        const local = this.getTailoredResumes();
        const map = new Map<string, TailoredResume>();
        local.forEach((r) => map.set(r.id, r));
        data.resumes.forEach((r: TailoredResume) => map.set(r.id, r));
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        safeSetItem(STORAGE_KEYS.TAILORED_RESUMES, merged);
        return merged;
      }
    } catch (_) {}
    return this.getTailoredResumes();
  },

  // Applications
  getApplications(): SavedApplication[] {
    return safeGetItem<SavedApplication[]>(STORAGE_KEYS.APPLICATIONS, []);
  },

  saveApplication(app: SavedApplication): SavedApplication {
    const list = this.getApplications();
    const index = list.findIndex((a) => a.id === app.id);
    let updated: SavedApplication[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = app;
    } else {
      updated = [app, ...list];
    }
    safeSetItem(STORAGE_KEYS.APPLICATIONS, updated);

    // Sync to MongoDB Atlas asynchronously
    if (typeof window !== 'undefined') {
      fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(app),
      }).catch((e) => console.error('Error syncing application to DB:', e));
    }

    return app;
  },

  deleteApplication(id: string): boolean {
    const list = this.getApplications();
    const filtered = list.filter((a) => a.id !== id);
    safeSetItem(STORAGE_KEYS.APPLICATIONS, filtered);

    if (typeof window !== 'undefined') {
      fetch(`/api/applications/${id}`, { method: 'DELETE' }).catch((e) =>
        console.error('Error deleting application from DB:', e)
      );
    }

    return true;
  },

  async syncApplicationsFromDb(): Promise<SavedApplication[]> {
    if (typeof window === 'undefined') return this.getApplications();
    try {
      const res = await fetch('/api/applications');
      if (!res.ok) return this.getApplications();
      const data = await res.json();
      if (Array.isArray(data.applications)) {
        const local = this.getApplications();
        const map = new Map<string, SavedApplication>();
        local.forEach((a) => map.set(a.id, a));
        data.applications.forEach((a: SavedApplication) => map.set(a.id, a));
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        safeSetItem(STORAGE_KEYS.APPLICATIONS, merged);
        return merged;
      }
    } catch (_) {}
    return this.getApplications();
  },

  // Settings
  getSettings(): UserSettings {
    return safeGetItem<UserSettings>(
      STORAGE_KEYS.SETTINGS,
      DEFAULT_USER_SETTINGS
    );
  },

  saveSettings(settings: UserSettings): UserSettings {
    safeSetItem(STORAGE_KEYS.SETTINGS, settings);
    return settings;
  },

  // Clear all data (Permanent delete option requirement)
  purgeAllUserData(): void {
    if (typeof window !== 'undefined') {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    }
    Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
  },
};
