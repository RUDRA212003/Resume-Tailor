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
  createEmptyProfile,
  BUILT_IN_TEMPLATES,
  DEFAULT_USER_SETTINGS,
} from './defaultData';

const STORAGE_KEYS = {
  PROFILE: 'resumecraft_profile_v5',
  TEMPLATES: 'resumecraft_templates_v3_ats',
  JOB_DESCRIPTIONS: 'resumecraft_jds_v1',
  ANALYSES: 'resumecraft_analyses_v1',
  TAILORED_RESUMES: 'resumecraft_tailored_resumes_v1',
  APPLICATIONS: 'resumecraft_applications_v1',
  SETTINGS: 'resumecraft_settings_v1',
};

// Global active user tracking in client session
let currentActiveUserId: string | null = null;

// Purge legacy shared keys on client load to ensure zero data leakage across user sessions
if (typeof window !== 'undefined') {
  try {
    [
      'resumecraft_tailored_resumes_v1',
      'resumecraft_jds_v1',
      'resumecraft_applications_v1',
      'resumecraft_analyses_v1',
    ].forEach((k) => {
      localStorage.removeItem(k);
    });
  } catch (_) {}
}

function resolveUserId(userId?: string): string | null {
  return userId || currentActiveUserId || null;
}

function getUserStorageKey(baseKey: string, userId?: string | null): string | null {
  const uid = resolveUserId(userId || undefined);
  if (!uid) return null;
  const cleanId = uid.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${baseKey}_${cleanId}`;
}

// In-memory fallback cache for SSR or node environments
const memoryStore: Record<string, unknown> = {};

function safeGetItem<T>(key: string | null, defaultValue: T): T {
  if (!key) return defaultValue;
  if (typeof window === 'undefined') {
    return (memoryStore[key] as T) ?? defaultValue;
  }
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

function safeSetItem<T>(key: string | null, value: T): void {
  if (!key) return;
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
  /**
   * Sets or clears the active authenticated Auth0 user ID for client-side storage scoping.
   */
  setActiveUserId(userId: string | null): void {
    currentActiveUserId = userId;
  },

  getActiveUserId(): string | null {
    return currentActiveUserId;
  },

  /**
   * Clears all cached user data in localStorage upon logout.
   */
  clearUserCache(userId?: string): void {
    const targetId = resolveUserId(userId);
    if (typeof window === 'undefined') return;
    try {
      if (targetId) {
        const suffix = targetId.replace(/[^a-zA-Z0-9_-]/g, '_');
        Object.keys(localStorage).forEach((key) => {
          if (key.includes(suffix)) {
            localStorage.removeItem(key);
          }
        });
      } else {
        Object.values(STORAGE_KEYS).forEach((k) => {
          localStorage.removeItem(k);
        });
      }
      currentActiveUserId = null;
    } catch (e) {
      console.error('Error clearing user cache:', e);
    }
  },

  // User Profile (multi-user scoped)
  getProfile(userId?: string): Profile {
    const key = getUserStorageKey(STORAGE_KEYS.PROFILE, userId);
    const profile = safeGetItem<Profile>(key, DEFAULT_PROFILE);
    if (
      profile &&
      profile.personalInfo &&
      (profile.personalInfo.fullName === 'RUDRESH M' ||
        profile.personalInfo.email === 'rudreshmanjunath15@gmail.com' ||
        profile.personalInfo.phone === '+91 6364152219') &&
      userId !== 'usr_001_demo'
    ) {
      const clean = createEmptyProfile(userId || '');
      safeSetItem(key, clean);
      return clean;
    }
    return profile;
  },

  cacheProfile(profile: Profile, userId?: string): void {
    const key = getUserStorageKey(STORAGE_KEYS.PROFILE, userId);
    safeSetItem(key, profile);
  },

  saveProfile(profile: Profile, userId?: string): Profile {
    const key = getUserStorageKey(STORAGE_KEYS.PROFILE, userId);
    const updated = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    safeSetItem(key, updated);
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

  resetProfile(userId?: string): Profile {
    const key = getUserStorageKey(STORAGE_KEYS.PROFILE, userId);
    const clean = createEmptyProfile(userId || '');
    safeSetItem(key, clean);
    return clean;
  },

  // Templates (Built-in + ATS styles)
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

  // Job Descriptions (Strictly User-Scoped)
  getJobDescriptions(userId?: string): JobDescription[] {
    const key = getUserStorageKey(STORAGE_KEYS.JOB_DESCRIPTIONS, userId);
    if (!key) return [];
    return safeGetItem<JobDescription[]>(key, []);
  },

  getJobDescriptionById(id: string, userId?: string): JobDescription | undefined {
    return this.getJobDescriptions(userId).find((jd) => jd.id === id);
  },

  saveJobDescription(jd: JobDescription, userId?: string): JobDescription {
    const key = getUserStorageKey(STORAGE_KEYS.JOB_DESCRIPTIONS, userId);
    if (!key) return jd;
    const list = this.getJobDescriptions(userId);
    const index = list.findIndex((item) => item.id === jd.id);
    let updated: JobDescription[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = jd;
    } else {
      updated = [jd, ...list];
    }
    safeSetItem(key, updated);

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

  async syncJobDescriptionsFromDb(userId?: string): Promise<JobDescription[]> {
    const key = getUserStorageKey(STORAGE_KEYS.JOB_DESCRIPTIONS, userId);
    if (!key || typeof window === 'undefined') return [];
    try {
      const res = await fetch('/api/job-descriptions');
      if (!res.ok) return this.getJobDescriptions(userId);
      const data = await res.json();
      if (Array.isArray(data.jobDescriptions)) {
        const local = this.getJobDescriptions(userId);
        const map = new Map<string, JobDescription>();
        local.forEach((j) => map.set(j.id, j));
        data.jobDescriptions.forEach((j: JobDescription) => map.set(j.id, j));
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        safeSetItem(key, merged);
        return merged;
      }
    } catch (_) {}
    return this.getJobDescriptions(userId);
  },

  // Tailored Resumes (Strictly User-Scoped)
  getTailoredResumes(userId?: string): TailoredResume[] {
    const key = getUserStorageKey(STORAGE_KEYS.TAILORED_RESUMES, userId);
    if (!key) return [];
    return safeGetItem<TailoredResume[]>(key, []);
  },

  getTailoredResumeById(id: string, userId?: string): TailoredResume | undefined {
    return this.getTailoredResumes(userId).find((r) => r.id === id);
  },

  saveTailoredResume(resume: TailoredResume, userId?: string): TailoredResume {
    const key = getUserStorageKey(STORAGE_KEYS.TAILORED_RESUMES, userId);
    if (!key) return resume;
    const list = this.getTailoredResumes(userId);
    const index = list.findIndex((r) => r.id === resume.id);
    let updated: TailoredResume[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = resume;
    } else {
      updated = [resume, ...list];
    }
    safeSetItem(key, updated);

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

  deleteTailoredResume(id: string, userId?: string): boolean {
    const key = getUserStorageKey(STORAGE_KEYS.TAILORED_RESUMES, userId);
    if (!key) return false;
    const list = this.getTailoredResumes(userId);
    const filtered = list.filter((r) => r.id !== id);
    safeSetItem(key, filtered);

    if (typeof window !== 'undefined') {
      fetch(`/api/tailored-resumes/${id}`, { method: 'DELETE' }).catch((e) =>
        console.error('Error deleting tailored resume from DB:', e)
      );
    }

    return true;
  },

  async syncTailoredResumesFromDb(userId?: string): Promise<TailoredResume[]> {
    const key = getUserStorageKey(STORAGE_KEYS.TAILORED_RESUMES, userId);
    if (!key || typeof window === 'undefined') return [];
    try {
      const res = await fetch('/api/tailored-resumes');
      if (!res.ok) return this.getTailoredResumes(userId);
      const data = await res.json();
      if (Array.isArray(data.resumes)) {
        const local = this.getTailoredResumes(userId);
        const map = new Map<string, TailoredResume>();
        local.forEach((r) => map.set(r.id, r));
        data.resumes.forEach((r: TailoredResume) => map.set(r.id, r));
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        safeSetItem(key, merged);
        return merged;
      }
    } catch (_) {}
    return this.getTailoredResumes(userId);
  },

  // Applications (Strictly User-Scoped)
  getApplications(userId?: string): SavedApplication[] {
    const key = getUserStorageKey(STORAGE_KEYS.APPLICATIONS, userId);
    if (!key) return [];
    return safeGetItem<SavedApplication[]>(key, []);
  },

  saveApplication(app: SavedApplication, userId?: string): SavedApplication {
    const key = getUserStorageKey(STORAGE_KEYS.APPLICATIONS, userId);
    if (!key) return app;
    const list = this.getApplications(userId);
    const index = list.findIndex((a) => a.id === app.id);
    let updated: SavedApplication[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = app;
    } else {
      updated = [app, ...list];
    }
    safeSetItem(key, updated);

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

  deleteApplication(id: string, userId?: string): boolean {
    const key = getUserStorageKey(STORAGE_KEYS.APPLICATIONS, userId);
    if (!key) return false;
    const list = this.getApplications(userId);
    const filtered = list.filter((a) => a.id !== id);
    safeSetItem(key, filtered);

    if (typeof window !== 'undefined') {
      fetch(`/api/applications/${id}`, { method: 'DELETE' }).catch((e) =>
        console.error('Error deleting application from DB:', e)
      );
    }

    return true;
  },

  async syncApplicationsFromDb(userId?: string): Promise<SavedApplication[]> {
    const key = getUserStorageKey(STORAGE_KEYS.APPLICATIONS, userId);
    if (!key || typeof window === 'undefined') return [];
    try {
      const res = await fetch('/api/applications');
      if (!res.ok) return this.getApplications(userId);
      const data = await res.json();
      if (Array.isArray(data.applications)) {
        const local = this.getApplications(userId);
        const map = new Map<string, SavedApplication>();
        local.forEach((a) => map.set(a.id, a));
        data.applications.forEach((a: SavedApplication) => map.set(a.id, a));
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        safeSetItem(key, merged);
        return merged;
      }
    } catch (_) {}
    return this.getApplications(userId);
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
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('resumecraft_')) {
          localStorage.removeItem(k);
        }
      });
    }
    Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
  },
};
