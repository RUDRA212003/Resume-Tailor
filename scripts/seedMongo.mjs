import { MongoClient } from 'mongodb';
import fs from 'fs';

let uri = process.env.MONGODB_URI;
if (!uri && fs.existsSync('.env.local')) {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const match = envFile.match(/MONGODB_URI=(.+)/);
  if (match) uri = match[1].trim();
}

if (!uri) {
  console.error('Error: MONGODB_URI is required. Please set it in process.env or in .env.local');
  process.exit(1);
}

// Import seed data definitions
const DEFAULT_PROFILE = {
  id: 'profile-primary-user',
  userId: 'usr_001_demo',
  personalInfo: {
    fullName: 'Alex Morgan',
    email: 'alex.morgan.dev@example.com',
    phone: '+1 (555) 382-9104',
    location: 'San Francisco, CA (Open to Remote)',
    linkedinUrl: 'https://linkedin.com/in/alexmorgan-dev',
    githubUrl: 'https://github.com/alexmorgan-code',
    portfolioUrl: 'https://alexmorgan.dev',
    otherLinks: [{ label: 'Technical Blog', url: 'https://alexmorgan.dev/blog' }],
  },
  summaries: [
    {
      id: 'sum-001',
      title: 'Full-Stack Software Engineer (Default)',
      content:
        'Software Engineer with 4+ years of hands-on experience building scalable web applications, robust backend microservices, and interactive frontend interfaces using Java, Spring Boot, React.js, Node.js, and SQL databases. Strong track record in API design, database query optimization, and CI/CD pipelines.',
      isDefault: true,
      createdAt: '2026-01-10T10:00:00Z',
    },
    {
      id: 'sum-002',
      title: 'Backend-Focused Systems Engineer',
      content:
        'Backend Engineer specializing in Java, Spring Boot, RESTful microservices, and high-performance transactional databases (PostgreSQL, MySQL). Passionate about system reliability, distributed architectures, and automated testing.',
      isDefault: false,
      createdAt: '2026-01-15T12:30:00Z',
    },
  ],
  skills: [
    { id: 'sk-001', name: 'Java', category: 'Programming Languages', proficiency: 'Expert', aliases: ['Java 17', 'Java 21', 'Core Java'], isVerified: true },
    { id: 'sk-002', name: 'JavaScript', category: 'Programming Languages', proficiency: 'Expert', aliases: ['JS', 'ES6'], isVerified: true },
    { id: 'sk-003', name: 'TypeScript', category: 'Programming Languages', proficiency: 'Advanced', aliases: ['TS'], isVerified: true },
    { id: 'sk-004', name: 'Python', category: 'Programming Languages', proficiency: 'Intermediate', aliases: ['Py'], isVerified: true },
    { id: 'sk-005', name: 'SQL', category: 'Programming Languages', proficiency: 'Expert', aliases: ['ANSI SQL'], isVerified: true },
    { id: 'sk-006', name: 'React.js', category: 'Frontend Technologies', proficiency: 'Expert', aliases: ['React', 'ReactJS'], isVerified: true },
    { id: 'sk-007', name: 'Next.js', category: 'Frontend Technologies', proficiency: 'Advanced', aliases: ['NextJS'], isVerified: true },
    { id: 'sk-008', name: 'HTML5', category: 'Frontend Technologies', proficiency: 'Expert', aliases: ['HTML'], isVerified: true },
    { id: 'sk-009', name: 'CSS3', category: 'Frontend Technologies', proficiency: 'Expert', aliases: ['CSS'], isVerified: true },
    { id: 'sk-010', name: 'Tailwind CSS', category: 'Frontend Technologies', proficiency: 'Advanced', aliases: ['Tailwind'], isVerified: true },
    { id: 'sk-011', name: 'Spring Boot', category: 'Backend Technologies', proficiency: 'Expert', aliases: ['SpringBoot', 'Spring'], isVerified: true },
    { id: 'sk-012', name: 'Node.js', category: 'Backend Technologies', proficiency: 'Advanced', aliases: ['Node', 'NodeJS'], isVerified: true },
    { id: 'sk-013', name: 'Express.js', category: 'Backend Technologies', proficiency: 'Advanced', aliases: ['Express'], isVerified: true },
    { id: 'sk-014', name: 'RESTful APIs', category: 'Backend Technologies', proficiency: 'Expert', aliases: ['REST APIs', 'REST'], isVerified: true },
    { id: 'sk-015', name: 'PostgreSQL', category: 'Databases', proficiency: 'Advanced', aliases: ['Postgres'], isVerified: true },
    { id: 'sk-016', name: 'MySQL', category: 'Databases', proficiency: 'Advanced', aliases: ['MySQL Server'], isVerified: true },
    { id: 'sk-017', name: 'MongoDB', category: 'Databases', proficiency: 'Intermediate', aliases: ['Mongo'], isVerified: true },
    { id: 'sk-018', name: 'Redis', category: 'Databases', proficiency: 'Intermediate', aliases: ['Redis Cache'], isVerified: true },
    { id: 'sk-019', name: 'Docker', category: 'Developer Tools', proficiency: 'Intermediate', aliases: ['Containers'], isVerified: true },
    { id: 'sk-020', name: 'AWS', category: 'Cloud Platforms', proficiency: 'Intermediate', aliases: ['Amazon Web Services'], isVerified: true },
  ],
  experiences: [
    {
      id: 'exp-001',
      company: 'Apex Cloud Technologies',
      jobTitle: 'Senior Software Engineer',
      employmentType: 'Full-time',
      startDate: '2023-03',
      endDate: 'Present',
      isCurrent: true,
      location: 'San Francisco, CA',
      technologies: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker', 'Redis', 'RESTful APIs'],
      isVerified: true,
      responsibilities: [
        {
          id: 'exp-001-resp-1',
          text: 'Architected and developed core enterprise payment gateway microservices using Java 17 and Spring Boot handling 2.5M daily transactions.',
          isVerified: true,
        },
        {
          id: 'exp-001-resp-2',
          text: 'Refactored legacy monolithic reporting queries into partitioned PostgreSQL queries with Redis caching, reducing average API response times by 42%.',
          isVerified: true,
        },
      ],
      achievements: [
        {
          id: 'exp-001-ach-1',
          text: 'Reduced customer checkout latency from 850ms to 290ms through asynchronous event streaming and database connection pool tuning.',
          isVerified: true,
        },
      ],
    },
  ],
  projects: [
    {
      id: 'proj-001',
      title: 'PayStream – Distributed Ledger & Settlement Engine',
      description: 'A distributed transactional ledger and payment settlement backend handling simulated multi-currency ledger accounts.',
      technologies: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker', 'Redis', 'JUnit'],
      githubUrl: 'https://github.com/alexmorgan-code/paystream-ledger',
      liveUrl: 'https://paystream-demo.alexmorgan.dev',
      duration: '4 months',
      keywords: ['Payment Gateway', 'Microservices', 'Distributed Systems'],
      isVerified: true,
      bullets: [
        {
          id: 'proj-001-b-1',
          text: 'Built high-concurrency payment ledger backend in Java and Spring Boot with ACID-compliant double-entry ledger bookkeeping.',
          isVerified: true,
        },
      ],
      achievements: [
        {
          id: 'proj-001-a-1',
          text: 'Achieved sustained throughput of 4,200 transactions per second in local Docker containerized stress benchmarks.',
          isVerified: true,
        },
      ],
    },
  ],
  education: [
    {
      id: 'edu-001',
      institution: 'University of California, Davis',
      degree: 'Bachelor of Science',
      branch: 'Computer Science & Engineering',
      startYear: '2017',
      graduationYear: '2021',
      cgpaOrPercentage: '3.82 / 4.0',
    },
  ],
  certifications: [
    {
      id: 'cert-001',
      name: 'AWS Certified Solutions Architect – Associate',
      issuingOrg: 'Amazon Web Services (AWS)',
      issueDate: '2023-08',
      credentialId: 'AWS-ASA-9941824',
    },
  ],
  achievements: [
    {
      id: 'ach-001',
      title: 'First Place – Bay Area FinTech Hackathon 2024',
      date: '2024-05',
      description: 'Built an open-source automated reconciliation engine for multi-tenant payment streams within 36 hours.',
    },
  ],
  updatedAt: new Date().toISOString(),
};

const BUILT_IN_TEMPLATES = [
  {
    id: 'tmpl-modern-minimalist',
    name: 'Modern Minimalist',
    description: 'Clean, Apple-inspired layout with subtle dividers and strong typographic hierarchy.',
    layoutType: 'modern',
    isBuiltIn: true,
    isDefault: true,
    accentColor: '#0066CC',
    fontFamily: 'Inter, -apple-system, sans-serif',
    sectionsOrder: ['summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'tmpl-executive-classic',
    name: 'Executive Classic',
    description: 'Traditional ATS-optimized resume format with centered header and formal structure.',
    layoutType: 'classic',
    isBuiltIn: true,
    isDefault: false,
    accentColor: '#1D1D1F',
    fontFamily: 'Georgia, Times New Roman, serif',
    sectionsOrder: ['summary', 'experience', 'skills', 'projects', 'education', 'certifications'],
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'tmpl-tech-clean',
    name: 'Tech Clean',
    description: 'Developer-first format highlighting technologies, GitHub repos, and live links.',
    layoutType: 'tech',
    isBuiltIn: true,
    isDefault: false,
    accentColor: '#0071E3',
    fontFamily: '-apple-system, SF Pro Text, sans-serif',
    sectionsOrder: ['skills', 'experience', 'projects', 'summary', 'education', 'certifications'],
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'tmpl-compact-single',
    name: 'Compact Single-Page',
    description: 'High-density format designed to fit substantial experience into a single page.',
    layoutType: 'compact',
    isBuiltIn: true,
    isDefault: false,
    accentColor: '#0066CC',
    fontFamily: '-apple-system, sans-serif',
    sectionsOrder: ['summary', 'skills', 'experience', 'projects', 'education'],
    createdAt: '2026-01-01T00:00:00Z',
  },
];

async function seed() {
  console.log('Seeding MongoDB database...');
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('resumecraft');

  // 1. Seed Profile
  await db.collection('profiles').updateOne(
    { userId: DEFAULT_PROFILE.userId },
    { $set: DEFAULT_PROFILE },
    { upsert: true }
  );
  console.log('✓ Seeded profile into "profiles" collection');

  // 2. Seed Templates
  for (const tmpl of BUILT_IN_TEMPLATES) {
    await db.collection('resume_templates').updateOne(
      { id: tmpl.id },
      { $set: tmpl },
      { upsert: true }
    );
  }
  console.log(`✓ Seeded ${BUILT_IN_TEMPLATES.length} templates into "resume_templates" collection`);

  // 3. Ensure indexes
  await db.collection('profiles').createIndex({ userId: 1 }, { unique: true });
  await db.collection('resume_templates').createIndex({ id: 1 }, { unique: true });
  await db.collection('job_descriptions').createIndex({ id: 1 }, { unique: true });
  await db.collection('tailored_resumes').createIndex({ id: 1 }, { unique: true });
  await db.collection('saved_applications').createIndex({ id: 1 }, { unique: true });
  console.log('✓ Created unique indexes on collections');

  const collections = await db.listCollections().toArray();
  console.log('✓ Active collections in resumecraft:', collections.map(c => c.name));

  await client.close();
  console.log('✓ Database seeding complete!');
}

seed().catch(console.error);
