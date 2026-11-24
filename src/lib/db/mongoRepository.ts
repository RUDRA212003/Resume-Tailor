import { getMongoDb, isMongoConfigured } from './mongodb';
import {
  Profile,
  ResumeTemplate,
  JobDescription,
  TailoredResume,
  SavedApplication,
  UserRecord,
  ApplicationHistoryItem,
  UserRole,
} from '@/types';
import { DEFAULT_PROFILE, createEmptyProfile, BUILT_IN_TEMPLATES } from '../storage/defaultData';

// In-memory isolated store used when MongoDB is offline, unconfigured, or in unit tests
class MemoryIsolatedStore {
  users = new Map<string, UserRecord>();
  profiles = new Map<string, Profile>();
  jobDescriptions = new Map<string, JobDescription>();
  tailoredResumes = new Map<string, TailoredResume>();
  applications = new Map<string, SavedApplication>();
  history = new Map<string, ApplicationHistoryItem>();
  templates = new Map<string, ResumeTemplate>();

  constructor() {
    for (const t of BUILT_IN_TEMPLATES) {
      this.templates.set(t.id, t);
    }
  }

  clear() {
    this.users.clear();
    this.profiles.clear();
    this.jobDescriptions.clear();
    this.tailoredResumes.clear();
    this.applications.clear();
    this.history.clear();
  }
}

const memoryStore = new MemoryIsolatedStore();

let indexesInitialized = false;

async function ensureIndexes() {
  if (indexesInitialized || !isMongoConfigured()) return;
  try {
    const db = await getMongoDb();
    await Promise.all([
      db.collection('users').createIndex({ auth0Id: 1 }, { unique: true }),
      db.collection('profiles').createIndex({ userId: 1 }, { unique: true }),
      db.collection('job_descriptions').createIndex({ userId: 1, createdAt: -1 }),
      db.collection('tailored_resumes').createIndex({ userId: 1, createdAt: -1 }),
      db.collection('saved_applications').createIndex({ userId: 1, createdAt: -1 }),
      db.collection('application_history').createIndex({ userId: 1, createdAt: -1 }),
      db.collection('resume_templates').createIndex({ id: 1 }, { unique: true }),
    ]);
    indexesInitialized = true;
  } catch (err) {
    console.warn('Index initialization note (non-fatal):', err);
  }
}

function createDefaultUserProfile(userId: string, name?: string, email?: string): Profile {
  return createEmptyProfile(userId, name || '', email || '');
}

export const mongoRepository = {
  // ============================================================================
  // 0. User Management
  // ============================================================================
  async syncUser(userData: {
    auth0Id: string;
    name: string;
    email: string;
    profileImage?: string;
    role?: UserRole;
  }): Promise<UserRecord> {
    const now = new Date().toISOString();
    const role: UserRole = userData.role || 'user';

    if (!isMongoConfigured()) {
      const existing = memoryStore.users.get(userData.auth0Id);
      const record: UserRecord = {
        auth0Id: userData.auth0Id,
        name: userData.name || existing?.name || 'User',
        email: userData.email || existing?.email || '',
        profileImage: userData.profileImage || existing?.profileImage,
        role: existing?.role || role,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };
      memoryStore.users.set(userData.auth0Id, record);
      return record;
    }

    try {
      await ensureIndexes();
      const db = await getMongoDb();
      const coll = db.collection<UserRecord>('users');

      const existing = await coll.findOne({ auth0Id: userData.auth0Id });
      const record: UserRecord = {
        auth0Id: userData.auth0Id,
        name: userData.name || existing?.name || 'User',
        email: userData.email || existing?.email || '',
        profileImage: userData.profileImage || existing?.profileImage,
        role: existing?.role || role,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };

      await coll.updateOne(
        { auth0Id: userData.auth0Id },
        {
          $set: {
            name: record.name,
            email: record.email,
            profileImage: record.profileImage,
            updatedAt: record.updatedAt,
          },
          $setOnInsert: {
            auth0Id: record.auth0Id,
            role: record.role,
            createdAt: record.createdAt,
          },
        },
        { upsert: true }
      );

      return record;
    } catch (err) {
      console.error('Mongo syncUser error:', err);
      throw err;
    }
  },

  async getUserByAuth0Id(auth0Id: string): Promise<UserRecord | null> {
    if (!isMongoConfigured()) {
      return memoryStore.users.get(auth0Id) || null;
    }
    try {
      const db = await getMongoDb();
      return await db.collection<UserRecord>('users').findOne({ auth0Id });
    } catch (err) {
      console.error('Mongo getUserByAuth0Id error:', err);
      return null;
    }
  },

  async getAllUsers(): Promise<UserRecord[]> {
    if (!isMongoConfigured()) {
      return Array.from(memoryStore.users.values());
    }
    try {
      const db = await getMongoDb();
      return await db.collection<UserRecord>('users').find({}).sort({ createdAt: -1 }).toArray();
    } catch (err) {
      console.error('Mongo getAllUsers error:', err);
      return [];
    }
  },

  // ============================================================================
  // 1. User Profiles (Strictly isolated by userId)
  // ============================================================================
  async getProfile(userId: string, userName?: string, userEmail?: string): Promise<Profile> {
    if (!isMongoConfigured()) {
      const existing = memoryStore.profiles.get(userId);
      if (existing) {
        if (
          existing.personalInfo &&
          (existing.personalInfo.fullName === 'RUDRESH M' ||
            existing.personalInfo.email === 'rudreshmanjunath15@gmail.com' ||
            existing.personalInfo.phone === '+91 6364152219') &&
          userId !== 'usr_001_demo'
        ) {
          const cleaned = createDefaultUserProfile(userId, userName, userEmail);
          memoryStore.profiles.set(userId, cleaned);
          return cleaned;
        }
        return existing;
      }
      const initial = createDefaultUserProfile(userId, userName, userEmail);
      memoryStore.profiles.set(userId, initial);
      return initial;
    }

    try {
      await ensureIndexes();
      const db = await getMongoDb();
      const coll = db.collection<Profile>('profiles');
      const doc = await coll.findOne({ userId });

      if (!doc) {
        const initial = createDefaultUserProfile(userId, userName, userEmail);
        await coll.insertOne(initial);
        return initial;
      }

      // Sanitize legacy demo data if account was seeded with demo data
      if (
        doc.personalInfo &&
        (doc.personalInfo.fullName === 'RUDRESH M' ||
          doc.personalInfo.email === 'rudreshmanjunath15@gmail.com' ||
          doc.personalInfo.phone === '+91 6364152219') &&
        userId !== 'usr_001_demo'
      ) {
        const cleaned = createDefaultUserProfile(userId, userName, userEmail);
        await coll.updateOne({ userId }, { $set: cleaned }, { upsert: true });
        return cleaned;
      }

      return doc;
    } catch (err) {
      console.error('Mongo getProfile error:', err);
      return createDefaultUserProfile(userId, userName, userEmail);
    }
  },

  async saveProfile(userId: string, profile: Profile): Promise<Profile> {
    const { _id, ...rest } = profile as any;
    const updated: Profile = {
      ...rest,
      userId, // Strictly enforce authenticated userId
      updatedAt: new Date().toISOString(),
    };

    if (!isMongoConfigured()) {
      memoryStore.profiles.set(userId, updated);
      return updated;
    }

    try {
      await ensureIndexes();
      const db = await getMongoDb();
      const coll = db.collection<Profile>('profiles');
      await coll.updateOne(
        { userId },
        { $set: updated },
        { upsert: true }
      );
      return updated;
    } catch (err) {
      console.error('Mongo saveProfile error:', err);
      throw err;
    }
  },

  // ============================================================================
  // 2. Job Descriptions (Isolated by userId)
  // ============================================================================
  async getJobDescriptions(userId: string): Promise<JobDescription[]> {
    if (!isMongoConfigured()) {
      return Array.from(memoryStore.jobDescriptions.values())
        .filter((jd) => jd.userId === userId)
        .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    }
    try {
      await ensureIndexes();
      const db = await getMongoDb();
      const coll = db.collection<JobDescription>('job_descriptions');
      return await coll.find({ userId }).sort({ createdAt: -1 }).toArray();
    } catch (err) {
      console.error('Mongo getJobDescriptions error:', err);
      return [];
    }
  },

  async getJobDescriptionById(id: string, userId: string): Promise<JobDescription | null> {
    if (!isMongoConfigured()) {
      const jd = memoryStore.jobDescriptions.get(id);
      return jd && jd.userId === userId ? jd : null;
    }
    try {
      const db = await getMongoDb();
      return await db.collection<JobDescription>('job_descriptions').findOne({ id, userId });
    } catch (err) {
      console.error('Mongo getJobDescriptionById error:', err);
      return null;
    }
  },

  async saveJobDescription(userId: string, jd: JobDescription): Promise<JobDescription> {
    const { _id, ...rest } = jd as any;
    const record: JobDescription = {
      ...rest,
      userId,
      createdAt: jd.createdAt || new Date().toISOString(),
    };

    if (!isMongoConfigured()) {
      memoryStore.jobDescriptions.set(jd.id, record);
      return record;
    }

    try {
      await ensureIndexes();
      const db = await getMongoDb();
      const coll = db.collection<JobDescription>('job_descriptions');
      await coll.updateOne({ id: jd.id, userId }, { $set: record }, { upsert: true });
      return record;
    } catch (err) {
      console.error('Mongo saveJobDescription error:', err);
      throw err;
    }
  },

  async deleteJobDescription(id: string, userId: string): Promise<boolean> {
    if (!isMongoConfigured()) {
      const existing = memoryStore.jobDescriptions.get(id);
      if (existing && existing.userId === userId) {
        memoryStore.jobDescriptions.delete(id);
        return true;
      }
      return false;
    }
    try {
      const db = await getMongoDb();
      const res = await db.collection('job_descriptions').deleteOne({ id, userId });
      return res.deletedCount > 0;
    } catch (err) {
      console.error('Mongo deleteJobDescription error:', err);
      return false;
    }
  },

  // ============================================================================
  // 3. Tailored Resumes (Isolated by userId, IDOR protected)
  // ============================================================================
  async getTailoredResumes(userId: string): Promise<TailoredResume[]> {
    if (!isMongoConfigured()) {
      return Array.from(memoryStore.tailoredResumes.values())
        .filter((r) => r.userId === userId)
        .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    }
    try {
      await ensureIndexes();
      const db = await getMongoDb();
      const coll = db.collection<TailoredResume>('tailored_resumes');
      return await coll.find({ userId }).sort({ createdAt: -1 }).toArray();
    } catch (err) {
      console.error('Mongo getTailoredResumes error:', err);
      return [];
    }
  },

  async getTailoredResumeById(id: string, userId: string): Promise<TailoredResume | null> {
    if (!isMongoConfigured()) {
      const r = memoryStore.tailoredResumes.get(id);
      return r && r.userId === userId ? r : null;
    }
    try {
      const db = await getMongoDb();
      return await db.collection<TailoredResume>('tailored_resumes').findOne({ id, userId });
    } catch (err) {
      console.error('Mongo getTailoredResumeById error:', err);
      return null;
    }
  },

  async saveTailoredResume(userId: string, resume: TailoredResume): Promise<TailoredResume> {
    const { _id, ...rest } = resume as any;
    const record: TailoredResume = {
      ...rest,
      userId,
      createdAt: resume.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!isMongoConfigured()) {
      memoryStore.tailoredResumes.set(resume.id, record);
      return record;
    }

    try {
      await ensureIndexes();
      const db = await getMongoDb();
      const coll = db.collection<TailoredResume>('tailored_resumes');
      await coll.updateOne({ id: resume.id, userId }, { $set: record }, { upsert: true });
      return record;
    } catch (err) {
      console.error('Mongo saveTailoredResume error:', err);
      throw err;
    }
  },

  async deleteTailoredResume(id: string, userId: string): Promise<boolean> {
    if (!isMongoConfigured()) {
      const existing = memoryStore.tailoredResumes.get(id);
      if (existing && existing.userId === userId) {
        memoryStore.tailoredResumes.delete(id);
        return true;
      }
      return false;
    }
    try {
      const db = await getMongoDb();
      const res = await db.collection('tailored_resumes').deleteOne({ id, userId });
      return res.deletedCount > 0;
    } catch (err) {
      console.error('Mongo deleteTailoredResume error:', err);
      return false;
    }
  },

  // ============================================================================
  // 4. Saved Applications (Isolated by userId, IDOR protected)
  // ============================================================================
  async getApplications(userId: string): Promise<SavedApplication[]> {
    if (!isMongoConfigured()) {
      return Array.from(memoryStore.applications.values())
        .filter((a) => a.userId === userId)
        .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    }
    try {
      await ensureIndexes();
      const db = await getMongoDb();
      const coll = db.collection<SavedApplication>('saved_applications');
      return await coll.find({ userId }).sort({ createdAt: -1 }).toArray();
    } catch (err) {
      console.error('Mongo getApplications error:', err);
      return [];
    }
  },

  async getApplicationById(id: string, userId: string): Promise<SavedApplication | null> {
    if (!isMongoConfigured()) {
      const a = memoryStore.applications.get(id);
      return a && a.userId === userId ? a : null;
    }
    try {
      const db = await getMongoDb();
      return await db.collection<SavedApplication>('saved_applications').findOne({ id, userId });
    } catch (err) {
      console.error('Mongo getApplicationById error:', err);
      return null;
    }
  },

  async saveApplication(userId: string, app: SavedApplication): Promise<SavedApplication> {
    const { _id, ...rest } = app as any;
    const record: SavedApplication = {
      ...rest,
      userId,
      createdAt: app.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!isMongoConfigured()) {
      memoryStore.applications.set(app.id, record);
      return record;
    }

    try {
      await ensureIndexes();
      const db = await getMongoDb();
      const coll = db.collection<SavedApplication>('saved_applications');
      await coll.updateOne({ id: app.id, userId }, { $set: record }, { upsert: true });
      return record;
    } catch (err) {
      console.error('Mongo saveApplication error:', err);
      throw err;
    }
  },

  async deleteApplication(id: string, userId: string): Promise<boolean> {
    if (!isMongoConfigured()) {
      const existing = memoryStore.applications.get(id);
      if (existing && existing.userId === userId) {
        memoryStore.applications.delete(id);
        return true;
      }
      return false;
    }
    try {
      const db = await getMongoDb();
      const res = await db.collection('saved_applications').deleteOne({ id, userId });
      return res.deletedCount > 0;
    } catch (err) {
      console.error('Mongo deleteApplication error:', err);
      return false;
    }
  },

  // ============================================================================
  // 5. Application History Log (Audit & Activity Trail)
  // ============================================================================
  async recordHistory(
    userId: string,
    action: string,
    relatedDocumentId?: string,
    details?: Record<string, any>
  ): Promise<ApplicationHistoryItem> {
    const item: ApplicationHistoryItem = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      action,
      relatedDocumentId,
      details,
      createdAt: new Date().toISOString(),
    };

    if (!isMongoConfigured()) {
      memoryStore.history.set(item.id, item);
      return item;
    }

    try {
      const db = await getMongoDb();
      await db.collection<ApplicationHistoryItem>('application_history').insertOne(item);
      return item;
    } catch (err) {
      console.error('Mongo recordHistory error:', err);
      return item;
    }
  },

  async getHistory(userId: string): Promise<ApplicationHistoryItem[]> {
    if (!isMongoConfigured()) {
      return Array.from(memoryStore.history.values())
        .filter((h) => h.userId === userId)
        .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    }
    try {
      const db = await getMongoDb();
      return await db
        .collection<ApplicationHistoryItem>('application_history')
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();
    } catch (err) {
      console.error('Mongo getHistory error:', err);
      return [];
    }
  },

  // ============================================================================
  // 6. Resume Templates (Shared catalog)
  // ============================================================================
  async getTemplates(): Promise<ResumeTemplate[]> {
    if (!isMongoConfigured()) return BUILT_IN_TEMPLATES;
    try {
      const db = await getMongoDb();
      const coll = db.collection<ResumeTemplate>('resume_templates');
      for (const tmpl of BUILT_IN_TEMPLATES) {
        await coll.updateOne({ id: tmpl.id }, { $set: { ...tmpl } }, { upsert: true });
      }
      return await coll.find({}).toArray();
    } catch (err) {
      console.error('Mongo getTemplates error:', err);
      return BUILT_IN_TEMPLATES;
    }
  },

  async saveTemplate(template: ResumeTemplate): Promise<ResumeTemplate> {
    if (!isMongoConfigured()) return template;
    try {
      const db = await getMongoDb();
      const coll = db.collection<ResumeTemplate>('resume_templates');
      const { _id, ...rest } = template as any;
      await coll.updateOne({ id: template.id }, { $set: rest }, { upsert: true });
      return template;
    } catch (err) {
      console.error('Mongo saveTemplate error:', err);
      return template;
    }
  },

  async deleteTemplate(id: string): Promise<boolean> {
    if (!isMongoConfigured()) return false;
    try {
      const db = await getMongoDb();
      const coll = db.collection<ResumeTemplate>('resume_templates');
      const res = await coll.deleteOne({ id, isBuiltIn: { $ne: true } });
      return res.deletedCount > 0;
    } catch (err) {
      console.error('Mongo deleteTemplate error:', err);
      return false;
    }
  },

  // ============================================================================
  // 7. Test Isolation Helper (Used by test suites)
  // ============================================================================
  clearMemoryStore(): void {
    memoryStore.clear();
  },
};
