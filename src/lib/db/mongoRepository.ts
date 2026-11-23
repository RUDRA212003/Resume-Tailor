import { getMongoDb, isMongoConfigured } from './mongodb';
import {
  Profile,
  ResumeTemplate,
  JobDescription,
  TailoredResume,
  SavedApplication,
  UserSettings,
} from '@/types';
import { DEFAULT_PROFILE, BUILT_IN_TEMPLATES, DEFAULT_USER_SETTINGS } from '../storage/defaultData';

export const mongoRepository = {
  // 1. Profile
  async getProfile(userId = 'usr_001_demo'): Promise<Profile> {
    if (!isMongoConfigured()) return DEFAULT_PROFILE;
    try {
      const db = await getMongoDb();
      const coll = db.collection<Profile>('profiles');
      const doc = await coll.findOne({ userId });
      if (!doc) {
        // Initialize with default profile
        await coll.insertOne(DEFAULT_PROFILE);
        return DEFAULT_PROFILE;
      }
      return doc;
    } catch (err) {
      console.error('Mongo getProfile error:', err);
      return DEFAULT_PROFILE;
    }
  },

  async saveProfile(profile: Profile): Promise<Profile> {
    if (!isMongoConfigured()) return profile;
    try {
      const db = await getMongoDb();
      const coll = db.collection<Profile>('profiles');
      const { _id, ...rest } = profile as any;
      const updated = { ...rest, updatedAt: new Date().toISOString() };
      await coll.updateOne(
        { userId: profile.userId },
        { $set: updated },
        { upsert: true }
      );
      return updated;
    } catch (err) {
      console.error('Mongo saveProfile error:', err);
      throw err;
    }
  },

  // 2. Templates
  async getTemplates(): Promise<ResumeTemplate[]> {
    if (!isMongoConfigured()) return BUILT_IN_TEMPLATES;
    try {
      const db = await getMongoDb();
      const coll = db.collection<ResumeTemplate>('resume_templates');
      // Ensure all built-in templates exist and are updated
      for (const tmpl of BUILT_IN_TEMPLATES) {
        await coll.updateOne(
          { id: tmpl.id },
          { $set: { ...tmpl } },
          { upsert: true }
        );
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

  // 3. Job Descriptions
  async getJobDescriptions(): Promise<JobDescription[]> {
    if (!isMongoConfigured()) return [];
    try {
      const db = await getMongoDb();
      const coll = db.collection<JobDescription>('job_descriptions');
      return await coll.find({}).sort({ createdAt: -1 }).toArray();
    } catch (err) {
      console.error('Mongo getJobDescriptions error:', err);
      return [];
    }
  },

  async saveJobDescription(jd: JobDescription): Promise<JobDescription> {
    if (!isMongoConfigured()) return jd;
    try {
      const db = await getMongoDb();
      const coll = db.collection<JobDescription>('job_descriptions');
      const { _id, ...rest } = jd as any;
      await coll.updateOne({ id: jd.id }, { $set: rest }, { upsert: true });
      return jd;
    } catch (err) {
      console.error('Mongo saveJobDescription error:', err);
      return jd;
    }
  },

  // 4. Tailored Resumes
  async getTailoredResumes(): Promise<TailoredResume[]> {
    if (!isMongoConfigured()) return [];
    try {
      const db = await getMongoDb();
      const coll = db.collection<TailoredResume>('tailored_resumes');
      return await coll.find({}).sort({ createdAt: -1 }).toArray();
    } catch (err) {
      console.error('Mongo getTailoredResumes error:', err);
      return [];
    }
  },

  async saveTailoredResume(resume: TailoredResume): Promise<TailoredResume> {
    if (!isMongoConfigured()) return resume;
    try {
      const db = await getMongoDb();
      const coll = db.collection<TailoredResume>('tailored_resumes');
      const { _id, ...rest } = resume as any;
      await coll.updateOne({ id: resume.id }, { $set: rest }, { upsert: true });
      return resume;
    } catch (err) {
      console.error('Mongo saveTailoredResume error:', err);
      return resume;
    }
  },

  async getTailoredResumeById(id: string): Promise<TailoredResume | null> {
    if (!isMongoConfigured()) return null;
    try {
      const db = await getMongoDb();
      const coll = db.collection<TailoredResume>('tailored_resumes');
      return await coll.findOne({ id });
    } catch (err) {
      console.error('Mongo getTailoredResumeById error:', err);
      return null;
    }
  },

  async deleteTailoredResume(id: string): Promise<boolean> {
    if (!isMongoConfigured()) return false;
    try {
      const db = await getMongoDb();
      const coll = db.collection<TailoredResume>('tailored_resumes');
      const res = await coll.deleteOne({ id });
      return res.deletedCount > 0;
    } catch (err) {
      console.error('Mongo deleteTailoredResume error:', err);
      return false;
    }
  },

  // 5. Applications
  async getApplications(): Promise<SavedApplication[]> {
    if (!isMongoConfigured()) return [];
    try {
      const db = await getMongoDb();
      const coll = db.collection<SavedApplication>('saved_applications');
      return await coll.find({}).sort({ createdAt: -1 }).toArray();
    } catch (err) {
      console.error('Mongo getApplications error:', err);
      return [];
    }
  },

  async getApplicationById(id: string): Promise<SavedApplication | null> {
    if (!isMongoConfigured()) return null;
    try {
      const db = await getMongoDb();
      const coll = db.collection<SavedApplication>('saved_applications');
      return await coll.findOne({ id });
    } catch (err) {
      console.error('Mongo getApplicationById error:', err);
      return null;
    }
  },

  async saveApplication(app: SavedApplication): Promise<SavedApplication> {
    if (!isMongoConfigured()) return app;
    try {
      const db = await getMongoDb();
      const coll = db.collection<SavedApplication>('saved_applications');
      const { _id, ...rest } = app as any;
      await coll.updateOne({ id: app.id }, { $set: rest }, { upsert: true });
      return app;
    } catch (err) {
      console.error('Mongo saveApplication error:', err);
      return app;
    }
  },

  async deleteApplication(id: string): Promise<boolean> {
    if (!isMongoConfigured()) return false;
    try {
      const db = await getMongoDb();
      const coll = db.collection<SavedApplication>('saved_applications');
      const res = await coll.deleteOne({ id });
      return res.deletedCount > 0;
    } catch (err) {
      console.error('Mongo deleteApplication error:', err);
      return false;
    }
  },

  // 6. Purge
  async purgeAllData(): Promise<void> {
    if (!isMongoConfigured()) return;
    try {
      const db = await getMongoDb();
      await db.collection('profiles').deleteMany({});
      await db.collection('job_descriptions').deleteMany({});
      await db.collection('tailored_resumes').deleteMany({});
      await db.collection('saved_applications').deleteMany({});
    } catch (err) {
      console.error('Mongo purgeAllData error:', err);
    }
  },
};
