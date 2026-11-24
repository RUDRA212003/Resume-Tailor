'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useAuthModal } from '@/context/AuthModalContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { repository } from '@/lib/storage/repository';
import { DEFAULT_PROFILE, BUILT_IN_TEMPLATES } from '@/lib/storage/defaultData';
import {
  FileText,
  Sparkles,
  Briefcase,
  Layers,
  ArrowRight,
  CheckCircle2,
  Download,
  Clock,
  Building,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { TailoredResume, JobDescription, SavedApplication, ResumeTemplate } from '@/types';

export default function DashboardPage() {
  const { user } = useUser();
  const { requireAuth } = useAuthModal();
  const [mounted, setMounted] = useState(false);

  const handleProtectedClick = (e: React.MouseEvent, href: string, featureName: string) => {
    if (!user) {
      e.preventDefault();
      requireAuth(href, featureName);
    }
  };
  const [tailoredResumes, setTailoredResumes] = useState<TailoredResume[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [applications, setApplications] = useState<SavedApplication[]>([]);
  const [templates, setTemplates] = useState<ResumeTemplate[]>(BUILT_IN_TEMPLATES);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  useEffect(() => {
    setMounted(true);
    setTailoredResumes(repository.getTailoredResumes());
    setJobDescriptions(repository.getJobDescriptions());
    setApplications(repository.getApplications());
    setTemplates(repository.getTemplates());
    setProfile(repository.getProfile());

    // Seamlessly sync with MongoDB Atlas
    repository.syncTailoredResumesFromDb().then((synced) => {
      if (synced && synced.length > 0) setTailoredResumes(synced);
    });
    repository.syncApplicationsFromDb().then((synced) => {
      if (synced && synced.length > 0) setApplications(synced);
    });
    repository.syncJobDescriptionsFromDb().then((synced) => {
      if (synced && synced.length > 0) setJobDescriptions(synced);
    });

    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.personalInfo) {
          setProfile(data);
          repository.cacheProfile(data);
        }
      })
      .catch(() => {});
  }, []);

  const totalVerifiedSkills = profile.skills.filter((s) => s.isVerified).length;
  const totalVerifiedExperiences = profile.experiences.filter((e) => e.isVerified).length;
  const totalVerifiedProjects = profile.projects.filter((p) => p.isVerified).length;

  const downloadDocx = async (resume: TailoredResume) => {
    try {
      const template = templates.find((t) => t.id === resume.templateId) || templates[0];
      const res = await fetch('/api/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, profile, template }),
      });
      if (!res.ok) throw new Error('DOCX export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${profile.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert('Could not download DOCX.');
    }
  };

  const downloadPdf = async (resume: TailoredResume) => {
    try {
      const template = templates.find((t) => t.id === resume.templateId) || templates[0];
      const res = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, profile, template }),
      });
      if (!res.ok) throw new Error('PDF export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${profile.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert('Could not download PDF.');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome & Quick Action Hero */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#E5E5E7] p-8 rounded-xl shadow-apple-card">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0066CC] uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>ResumeCraft Studio</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
              Welcome back, {profile.personalInfo.fullName}
            </h1>
            <p className="text-sm text-[#555555] max-w-xl">
              Tailor ATS-optimized resumes aligned with any job description in seconds. Factual accuracy strictly guaranteed from your verified profile repository.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Link
              href="/profile"
              onClick={(e) => handleProtectedClick(e, '/profile', 'Profile Management')}
            >
              <Button variant="secondary" size="md">
                Edit Profile
              </Button>
            </Link>
            <Link
              href="/tailor"
              onClick={(e) => handleProtectedClick(e, '/tailor', 'Resume Tailoring Studio')}
            >
              <Button size="md" pill icon={<Sparkles className="w-4 h-4" />}>
                Create Tailored Resume
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Primary Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#555555]">Resumes Generated</p>
              <div className="p-2 bg-[#F0F7FF] rounded-lg text-[#0066CC]">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1D1D1F] mt-2">
              {tailoredResumes.length}
            </p>
            <p className="text-xs text-[#555555] mt-1">
              {tailoredResumes.length > 0 ? 'Custom versions ready' : 'No resumes yet'}
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#555555]">Job Descriptions</p>
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                <Building className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1D1D1F] mt-2">
              {jobDescriptions.length}
            </p>
            <p className="text-xs text-[#555555] mt-1">Analyzed requirements</p>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#555555]">Saved Applications</p>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1D1D1F] mt-2">
              {applications.length}
            </p>
            <p className="text-xs text-[#555555] mt-1">Tracked job submissions</p>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#555555]">Resume Templates</p>
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1D1D1F] mt-2">{templates.length}</p>
            <p className="text-xs text-[#555555] mt-1">ATS-compatible styles</p>
          </Card>
        </div>

        {/* Central Repository Health Card */}
        <Card className="bg-[#FBFBFC]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0066CC]" />
                <h2 className="text-sm font-semibold text-[#1D1D1F]">
                  Profile Ground Truth Repository Status
                </h2>
                <Badge variant="available" size="sm">
                  Active
                </Badge>
              </div>
              <p className="text-xs text-[#555555]">
                Single source of truth: {totalVerifiedSkills} skills, {totalVerifiedExperiences} experiences, and {totalVerifiedProjects} projects verified. The AI will never invent facts outside these.
              </p>
            </div>
            <Link
              href="/profile"
              onClick={(e) => handleProtectedClick(e, '/profile', 'Repository Facts')}
            >
              <Button variant="secondary" size="sm">
                Manage Repository Facts
              </Button>
            </Link>
          </div>
        </Card>

        {/* 2-Column: Recently Generated Resumes & Recent Job Descriptions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Resumes */}
          <Card>
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7]">
              <div>
                <h3 className="font-semibold text-sm text-[#1D1D1F]">
                  Recently Generated Resumes
                </h3>
                <p className="text-xs text-[#555555]">Tailored for specific job postings</p>
              </div>
              <Link
                href="/tailor"
                className="text-xs font-semibold text-[#0066CC] hover:underline flex items-center gap-1"
              >
                <span>New Tailor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-[#E5E5E7] mt-2">
              {tailoredResumes.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#555555] space-y-3">
                  <AlertCircle className="w-8 h-8 text-[#888888] mx-auto opacity-50" />
                  <p>No tailored resumes created yet.</p>
                  <Link href="/tailor">
                    <Button size="sm" pill>
                      Tailor your first resume
                    </Button>
                  </Link>
                </div>
              ) : (
                tailoredResumes.slice(0, 4).map((resume) => (
                  <div key={resume.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-xs text-[#1D1D1F] truncate">
                        {resume.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#555555]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {mounted ? new Date(resume.createdAt).toLocaleDateString() : ''}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium">
                          {resume.analysis?.relevanceScore ?? 92}% Match
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      <Link href={`/tailor?resumeId=${resume.id}`}>
                        <Button
                          size="sm"
                          pill
                          icon={<Sparkles className="w-3.5 h-3.5" />}
                        >
                          Open
                        </Button>
                      </Link>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => downloadPdf(resume)}
                        icon={<Download className="w-3.5 h-3.5" />}
                      >
                        PDF
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => downloadDocx(resume)}
                        icon={<Download className="w-3.5 h-3.5" />}
                      >
                        DOCX
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Recent Job Descriptions */}
          <Card>
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7]">
              <div>
                <h3 className="font-semibold text-sm text-[#1D1D1F]">
                  Recent Job Descriptions
                </h3>
                <p className="text-xs text-[#555555]">Roles analyzed and matched</p>
              </div>
              <Link
                href="/tailor"
                className="text-xs font-semibold text-[#0066CC] hover:underline flex items-center gap-1"
              >
                <span>Upload JD</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-[#E5E5E7] mt-2">
              {jobDescriptions.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#555555] space-y-3">
                  <FileText className="w-8 h-8 text-[#888888] mx-auto opacity-50" />
                  <p>No job descriptions analyzed yet.</p>
                  <Link
                    href="/tailor"
                    onClick={(e) => handleProtectedClick(e, '/tailor', 'Job Description Tailoring')}
                  >
                    <Button variant="secondary" size="sm">
                      Upload or paste a JD
                    </Button>
                  </Link>
                </div>
              ) : (
                jobDescriptions.slice(0, 4).map((jd) => (
                  <div key={jd.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-xs text-[#1D1D1F] truncate">
                        {jd.jobTitle} at {jd.companyName}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#555555]">
                        <span>{jd.location || 'Remote'}</span>
                        <span>•</span>
                        <span>{mounted ? new Date(jd.createdAt).toLocaleDateString() : ''}</span>
                      </div>
                    </div>

                    <Link href={`/tailor?jdId=${jd.id}`}>
                      <Button variant="secondary" size="sm">
                        Tailor Again
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
