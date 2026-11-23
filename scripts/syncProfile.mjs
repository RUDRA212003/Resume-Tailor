import { MongoClient } from 'mongodb';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const match = envFile.match(/MONGODB_URI=(.+)/);
if (!match) {
  console.log('No MONGODB_URI found');
  process.exit(1);
}
const uri = match[1].trim();

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('resumecraft');
    const coll = db.collection('profiles');

    // Fetch the current document
    const doc = await coll.findOne({ userId: 'usr_001_demo' });
    console.log('Current user in MongoDB:', doc?.personalInfo?.fullName);
    console.log('Current experiences in MongoDB:', doc?.experiences?.map(e => e.company));
    console.log('Current projects in MongoDB:', doc?.projects?.map(p => p.title));

    // Update skills to match the resume exactly
    const updatedSkills = [
      { id: 'sk-001', name: 'Java', category: 'Programming Languages', proficiency: 'Advanced', aliases: ['Core Java', 'Java 17', 'Java 21'], isVerified: true },
      { id: 'sk-002', name: 'TypeScript', category: 'Programming Languages', proficiency: 'Advanced', aliases: ['TS'], isVerified: true },
      { id: 'sk-002b', name: 'JavaScript', category: 'Programming Languages', proficiency: 'Expert', aliases: ['JS', 'ES6'], isVerified: true },
      { id: 'sk-003', name: 'HTML5', category: 'Programming Languages', proficiency: 'Expert', aliases: ['HTML'], isVerified: true },
      { id: 'sk-004', name: 'CSS3', category: 'Programming Languages', proficiency: 'Expert', aliases: ['CSS'], isVerified: true },
      { id: 'sk-005', name: 'React.js', category: 'Frontend Technologies', proficiency: 'Expert', aliases: ['React', 'ReactJS'], isVerified: true },
      { id: 'sk-006', name: 'Next.js', category: 'Frontend Technologies', proficiency: 'Advanced', aliases: ['NextJS', 'Next'], isVerified: true },
      { id: 'sk-007', name: 'Redux', category: 'Frontend Technologies', proficiency: 'Advanced', aliases: ['Redux Toolkit'], isVerified: true },
      { id: 'sk-008', name: 'Zustand', category: 'Frontend Technologies', proficiency: 'Advanced', aliases: ['Zustand State Management'], isVerified: true },
      { id: 'sk-009', name: 'React Query', category: 'Frontend Technologies', proficiency: 'Advanced', aliases: ['TanStack Query'], isVerified: true },
      { id: 'sk-010', name: 'Styled Components', category: 'Frontend Technologies', proficiency: 'Advanced', aliases: ['Styled-components'], isVerified: true },
      { id: 'sk-011', name: 'Tailwind CSS', category: 'Frontend Technologies', proficiency: 'Expert', aliases: ['Tailwind'], isVerified: true },
      { id: 'sk-012', name: 'Lazy Loading', category: 'Frontend Technologies', proficiency: 'Advanced', aliases: ['Web Performance', 'Code Splitting'], isVerified: true },
      { id: 'sk-013', name: 'Pagination', category: 'Frontend Technologies', proficiency: 'Advanced', aliases: ['Data Pagination'], isVerified: true },
      { id: 'sk-014', name: 'Spring Boot', category: 'Backend Technologies', proficiency: 'Advanced', aliases: ['SpringBoot', 'Spring Framework'], isVerified: true },
      { id: 'sk-015', name: 'PostgreSQL', category: 'Databases', proficiency: 'Advanced', aliases: ['Postgres'], isVerified: true },
      { id: 'sk-016', name: 'MySQL', category: 'Databases', proficiency: 'Advanced', aliases: ['MySQL Server'], isVerified: true },
      { id: 'sk-017', name: 'MongoDB', category: 'Databases', proficiency: 'Advanced', aliases: ['Mongo', 'NoSQL MongoDB'], isVerified: true },
      { id: 'sk-018', name: 'Git', category: 'Developer Tools', proficiency: 'Expert', aliases: ['Version Control'], isVerified: true },
      { id: 'sk-019', name: 'GitHub', category: 'Developer Tools', proficiency: 'Expert', aliases: ['GitHub Actions'], isVerified: true },
      { id: 'sk-020', name: 'GitLab CI/CD', category: 'Developer Tools', proficiency: 'Advanced', aliases: ['GitLab', 'CI/CD Pipelines'], isVerified: true },
      { id: 'sk-021', name: 'Talend', category: 'Developer Tools', proficiency: 'Advanced', aliases: ['Talend ETL', 'Talend Data Integration'], isVerified: true },
      { id: 'sk-022', name: 'Postman', category: 'Developer Tools', proficiency: 'Expert', aliases: ['API Testing'], isVerified: true },
      { id: 'sk-023', name: 'Jira', category: 'Developer Tools', proficiency: 'Advanced', aliases: ['Atlassian Jira', 'Agile/Scrum'], isVerified: true },
      { id: 'sk-024', name: 'Spinnaker', category: 'Developer Tools', proficiency: 'Intermediate', aliases: ['Continuous Delivery'], isVerified: true },
      { id: 'sk-025', name: 'PuTTY', category: 'Developer Tools', proficiency: 'Intermediate', aliases: ['SSH Client'], isVerified: true },
      { id: 'sk-026', name: 'WinSCP', category: 'Developer Tools', proficiency: 'Intermediate', aliases: ['SFTP Client'], isVerified: true },
      { id: 'sk-027', name: 'Unit & Functional Testing', category: 'Testing Tools', proficiency: 'Advanced', aliases: ['Unit Testing', 'Functional Testing'], isVerified: true },
    ];

    await coll.updateOne(
      { userId: 'usr_001_demo' },
      { $set: { skills: updatedSkills, updatedAt: new Date().toISOString() } }
    );
    console.log('Updated skills in MongoDB successfully!');

    // Sync template
    const tmplColl = db.collection('resume_templates');
    const template = {
      id: 'tmpl-ats-verified',
      name: 'ATS Single-Column (Verified Resume Replica)',
      description: 'Exact 1:1 replica of your uploaded resume layout. ATS-tested single column with horizontal dividers, bold key-value skills, and clean font hierarchy.',
      layoutType: 'classic',
      isBuiltIn: true,
      isDefault: true,
      accentColor: '#1D1D1F',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      sectionsOrder: ['summary', 'skills', 'experience', 'projects', 'education'],
      createdAt: '2026-01-01T00:00:00Z',
    };
    await tmplColl.updateOne({ id: 'tmpl-ats-verified' }, { $set: template }, { upsert: true });
    await tmplColl.updateMany({ id: { $ne: 'tmpl-ats-verified' } }, { $set: { isDefault: false } });
    console.log('Updated templates in MongoDB successfully!');
  } finally {
    await client.close();
  }
}

run();
