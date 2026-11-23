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

const RUDRESH_PROFILE = {
  id: 'profile-rudresh-m',
  userId: 'usr_001_demo',
  personalInfo: {
    fullName: 'RUDRESH M',
    email: 'rudreshmanjunath15@gmail.com',
    phone: '+91 6364152219',
    location: 'Bangalore / Tiptur, Karnataka, India',
    linkedinUrl: 'https://linkedin.com/in/rudresh-m',
    githubUrl: 'https://github.com/rudresh-m',
    portfolioUrl: 'https://rudresh-portfolio.vercel.app',
    otherLinks: [
      { label: 'LinkedIn', url: 'https://linkedin.com/in/rudresh-m' },
      { label: 'Portfolio', url: 'https://rudresh-portfolio.vercel.app' },
    ],
  },
  summaries: [
    {
      id: 'sum-001',
      title: 'Software Engineer (Full-Stack & Systems)',
      content:
        'Software Engineer with enterprise experience building scalable full-stack applications with React.js and Spring Boot, developing robust ETL data migration pipelines with Talend and Oracle SQL, and delivering AI-powered web applications using Next.js, Supabase, and MongoDB.',
      isDefault: true,
      createdAt: '2026-01-10T10:00:00Z',
    },
    {
      id: 'sum-002',
      title: 'Full-Stack Developer (React.js & Next.js)',
      content:
        'Frontend & Full-Stack Developer proficient in React.js, Next.js, TypeScript, Tailwind CSS, Redux, and Zustand. Experienced in integrating voice AI workflows, automated web scraping pipelines with Bright Data, and high-performance databases (PostgreSQL, MongoDB).',
      isDefault: false,
      createdAt: '2026-01-15T12:30:00Z',
    },
  ],
  skills: [
    // Programming Languages
    {
      id: 'sk-001',
      name: 'Java',
      category: 'Programming Languages',
      proficiency: 'Advanced',
      aliases: ['Core Java', 'Java 17', 'Java 21'],
      isVerified: true,
    },
    {
      id: 'sk-002',
      name: 'TypeScript',
      category: 'Programming Languages',
      proficiency: 'Advanced',
      aliases: ['TS'],
      isVerified: true,
    },
    {
      id: 'sk-003',
      name: 'JavaScript',
      category: 'Programming Languages',
      proficiency: 'Advanced',
      aliases: ['JS', 'ES6'],
      isVerified: true,
    },
    {
      id: 'sk-004',
      name: 'HTML5',
      category: 'Frontend Technologies',
      proficiency: 'Expert',
      aliases: ['HTML'],
      isVerified: true,
    },
    {
      id: 'sk-005',
      name: 'CSS3',
      category: 'Frontend Technologies',
      proficiency: 'Expert',
      aliases: ['CSS'],
      isVerified: true,
    },
    // Frontend Technologies
    {
      id: 'sk-006',
      name: 'React.js',
      category: 'Frontend Technologies',
      proficiency: 'Expert',
      aliases: ['React', 'ReactJS'],
      isVerified: true,
    },
    {
      id: 'sk-007',
      name: 'Next.js',
      category: 'Frontend Technologies',
      proficiency: 'Advanced',
      aliases: ['NextJS', 'Next'],
      isVerified: true,
    },
    {
      id: 'sk-008',
      name: 'Redux',
      category: 'Frontend Technologies',
      proficiency: 'Advanced',
      aliases: ['Redux Toolkit'],
      isVerified: true,
    },
    {
      id: 'sk-009',
      name: 'Zustand',
      category: 'Frontend Technologies',
      proficiency: 'Advanced',
      aliases: ['Zustand State Management'],
      isVerified: true,
    },
    {
      id: 'sk-010',
      name: 'React Query',
      category: 'Frontend Technologies',
      proficiency: 'Advanced',
      aliases: ['TanStack Query'],
      isVerified: true,
    },
    {
      id: 'sk-011',
      name: 'Styled Components',
      category: 'Frontend Technologies',
      proficiency: 'Advanced',
      aliases: ['Styled-components'],
      isVerified: true,
    },
    {
      id: 'sk-012',
      name: 'Tailwind CSS',
      category: 'Frontend Technologies',
      proficiency: 'Expert',
      aliases: ['Tailwind'],
      isVerified: true,
    },
    // Backend Technologies
    {
      id: 'sk-013',
      name: 'Spring Boot',
      category: 'Backend Technologies',
      proficiency: 'Advanced',
      aliases: ['SpringBoot', 'Spring Framework'],
      isVerified: true,
    },
    // Databases
    {
      id: 'sk-014',
      name: 'PostgreSQL',
      category: 'Databases',
      proficiency: 'Advanced',
      aliases: ['Postgres'],
      isVerified: true,
    },
    {
      id: 'sk-015',
      name: 'MySQL',
      category: 'Databases',
      proficiency: 'Advanced',
      aliases: ['MySQL Server'],
      isVerified: true,
    },
    {
      id: 'sk-016',
      name: 'MongoDB',
      category: 'Databases',
      proficiency: 'Advanced',
      aliases: ['Mongo', 'NoSQL MongoDB'],
      isVerified: true,
    },
    {
      id: 'sk-017',
      name: 'Oracle SQL',
      category: 'Databases',
      proficiency: 'Advanced',
      aliases: ['Oracle Database', 'PL/SQL', 'SQL'],
      isVerified: true,
    },
    // Developer Tools & Platforms
    {
      id: 'sk-018',
      name: 'Git',
      category: 'Developer Tools',
      proficiency: 'Expert',
      aliases: ['Version Control'],
      isVerified: true,
    },
    {
      id: 'sk-019',
      name: 'GitHub',
      category: 'Developer Tools',
      proficiency: 'Expert',
      aliases: ['GitHub Actions'],
      isVerified: true,
    },
    {
      id: 'sk-020',
      name: 'GitLab CI/CD',
      category: 'Developer Tools',
      proficiency: 'Advanced',
      aliases: ['GitLab', 'CI/CD Pipelines'],
      isVerified: true,
    },
    {
      id: 'sk-021',
      name: 'Talend',
      category: 'Developer Tools',
      proficiency: 'Advanced',
      aliases: ['Talend ETL', 'Talend Data Integration'],
      isVerified: true,
    },
    {
      id: 'sk-022',
      name: 'Postman',
      category: 'Developer Tools',
      proficiency: 'Expert',
      aliases: ['API Testing'],
      isVerified: true,
    },
    {
      id: 'sk-023',
      name: 'Jira',
      category: 'Developer Tools',
      proficiency: 'Advanced',
      aliases: ['Atlassian Jira', 'Agile/Scrum'],
      isVerified: true,
    },
    {
      id: 'sk-024',
      name: 'Spinnaker',
      category: 'Developer Tools',
      proficiency: 'Intermediate',
      aliases: ['Continuous Delivery'],
      isVerified: true,
    },
    {
      id: 'sk-025',
      name: 'PuTTY',
      category: 'Developer Tools',
      proficiency: 'Intermediate',
      aliases: ['SSH Client'],
      isVerified: true,
    },
    {
      id: 'sk-026',
      name: 'WinSCP',
      category: 'Developer Tools',
      proficiency: 'Intermediate',
      aliases: ['SFTP Client'],
      isVerified: true,
    },
    // Performance & Testing
    {
      id: 'sk-027',
      name: 'Unit & Functional Testing',
      category: 'Testing Tools',
      proficiency: 'Advanced',
      aliases: ['Unit Testing', 'Functional Testing'],
      isVerified: true,
    },
    {
      id: 'sk-028',
      name: 'Lazy Loading & Code Splitting',
      category: 'Frontend Technologies',
      proficiency: 'Advanced',
      aliases: ['Web Performance Optimization', 'Pagination'],
      isVerified: true,
    },
  ],
  experiences: [
    {
      id: 'exp-001',
      company: 'CAE',
      jobTitle: 'Software Engineer Intern',
      employmentType: 'Internship',
      startDate: '2026-02',
      endDate: '2026-11',
      isCurrent: false,
      location: 'Bangalore, India',
      technologies: ['React.js', 'Spring Boot', 'Talend', 'Oracle SQL', 'GitLab CI/CD'],
      isVerified: true,
      responsibilities: [
        {
          id: 'exp-cae-1',
          text: 'Contributed to enterprise data migration projects by developing ETL workflows using Talend for large-scale data transformation, validation, and migration activities.',
          isVerified: true,
        },
        {
          id: 'exp-cae-2',
          text: 'Developed and maintained React-based user interfaces and integrated them with Spring Boot backend services to deliver scalable enterprise applications.',
          isVerified: true,
        },
        {
          id: 'exp-cae-3',
          text: 'Wrote and optimized complex Oracle SQL queries to validate migrated data, perform data reconciliation, and ensure end-to-end data integrity.',
          isVerified: true,
        },
        {
          id: 'exp-cae-4',
          text: 'Designed and developed an Auto Release Notes Generator tool that automatically generated release notes for every build version, improving release management efficiency and reducing manual effort.',
          isVerified: true,
        },
      ],
      achievements: [
        {
          id: 'exp-cae-ach-1',
          text: 'Streamlined release documentation pipeline saving engineering teams hours of manual effort on every release build.',
          isVerified: true,
        },
      ],
    },
    {
      id: 'exp-002',
      company: 'MindMatrix',
      jobTitle: 'Android App Development Intern',
      employmentType: 'Internship',
      startDate: '2025-12',
      endDate: '2026-02',
      isCurrent: false,
      location: 'Remote',
      technologies: ['Java', 'Kotlin', 'Android Studio', 'Mobile UI'],
      isVerified: true,
      responsibilities: [
        {
          id: 'exp-mm-1',
          text: 'Learned Android application development fundamentals including application lifecycle, UI design principles, navigation, and mobile development best practices.',
          isVerified: true,
        },
        {
          id: 'exp-mm-2',
          text: 'Developed simple Android applications using Java/Kotlin and Android Studio to gain hands-on experience with mobile app development.',
          isVerified: true,
        },
      ],
      achievements: [],
    },
  ],
  projects: [
    {
      id: 'proj-001',
      title: 'Career Mock – AI-Powered Voice Interview Platform',
      description: 'An AI-powered voice interview simulation platform delivering real-time voice evaluations, authentication, and automated candidate assessments.',
      technologies: ['Next.js', 'Groq AI', 'Vapi', 'Supabase', 'TypeScript', 'Tailwind CSS'],
      githubUrl: 'https://github.com/rudresh-m/career-mock',
      liveUrl: 'https://careermock.vercel.app',
      duration: 'Sep 2025 – Nov 2025',
      keywords: ['AI Voice Agents', 'Next.js', 'Groq AI', 'Vapi', 'Supabase', 'RBAC', 'Automated Assessments'],
      isVerified: true,
      bullets: [
        {
          id: 'proj-cm-1',
          text: 'Developed and tested AI-powered voice interview workflows, ensuring reliable user interactions and seamless interview experiences.',
          isVerified: true,
        },
        {
          id: 'proj-cm-2',
          text: 'Implemented and validated authentication, role-based access control (RBAC), and backend API integrations to support secure platform operations.',
          isVerified: true,
        },
        {
          id: 'proj-cm-3',
          text: 'Integrated Groq AI and Vapi services to power real-time voice-based interview simulations and automated candidate assessments.',
          isVerified: true,
        },
        {
          id: 'proj-cm-4',
          text: 'Analyzed AI-generated interview feedback, identified inconsistencies, and documented issues to improve response quality, system accuracy, and overall user experience.',
          isVerified: true,
        },
      ],
      achievements: [
        {
          id: 'proj-cm-ach-1',
          text: 'Achieved sub-second voice latency responses through optimized Groq AI LLM inference streaming and Vapi WebRTC piping.',
          isVerified: true,
        },
      ],
    },
    {
      id: 'proj-002',
      title: 'Rupee Tracker – E-commerce Price Tracker',
      description: 'An automated price tracking web application monitoring price volatility across e-commerce platforms with automated data pipelines.',
      technologies: ['Next.js', 'Bright Data', 'MongoDB', 'TypeScript', 'RESTful APIs'],
      githubUrl: 'https://github.com/rudresh-m/rupee-tracker',
      liveUrl: 'https://rupeetracker.vercel.app',
      duration: 'Feb 2025 – Mar 2025',
      keywords: ['Price Tracker', 'Bright Data', 'Web Scraping', 'MongoDB', 'Next.js', 'Data Validation'],
      isVerified: true,
      bullets: [
        {
          id: 'proj-rt-1',
          text: 'Developed a web application to monitor and track product prices across multiple e-commerce platforms in real time.',
          isVerified: true,
        },
        {
          id: 'proj-rt-2',
          text: 'Built automated data collection pipelines using Bright Data Web Unlocker and implemented data validation for accurate price tracking.',
          isVerified: true,
        },
        {
          id: 'proj-rt-3',
          text: 'Integrated APIs and MongoDB for secure data storage and efficient retrieval of product pricing information.',
          isVerified: true,
        },
      ],
      achievements: [
        {
          id: 'proj-rt-ach-1',
          text: 'Successfully processed and stored product telemetry across multiple storefronts with automated deduplication in MongoDB.',
          isVerified: true,
        },
      ],
    },
  ],
  education: [
    {
      id: 'edu-001',
      institution: 'Kalpataru Institute Of Technology, Tiptur',
      degree: 'Bachelor of Engineering',
      branch: 'Computer Science and Engineering',
      startYear: '2022',
      graduationYear: '2026',
      cgpaOrPercentage: '8.4 / 10',
      additionalInfo: 'Location: Tiptur, Karnataka',
    },
  ],
  certifications: [],
  achievements: [
    {
      id: 'ach-001',
      title: 'Auto Release Notes Generator tool developed at CAE',
      date: '2026',
      description: 'Engineered an internal build version release note tool automating version tracking and reducing manual engineering overhead.',
    },
  ],
  updatedAt: new Date().toISOString(),
};

async function updateProfile() {
  console.log('Updating profile in MongoDB Atlas...');
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('resumecraft');

  const result = await db.collection('profiles').updateOne(
    { userId: RUDRESH_PROFILE.userId },
    { $set: RUDRESH_PROFILE },
    { upsert: true }
  );

  console.log('✓ Successfully updated MongoDB Atlas profiles collection:', result);

  const saved = await db.collection('profiles').findOne({ userId: RUDRESH_PROFILE.userId });
  console.log('✓ Verified saved candidate:', saved.personalInfo.fullName, saved.personalInfo.phone, saved.personalInfo.email);

  await client.close();
}

updateProfile().catch(console.error);
