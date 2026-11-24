'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { repository } from '@/lib/storage/repository';
import { DEFAULT_PROFILE, BUILT_IN_TEMPLATES } from '@/lib/storage/defaultData';
import { SavedApplication, TailoredResume, Profile, ResumeTemplate } from '@/types';
import {
  Briefcase,
  Download,
  Trash2,
  ExternalLink,
  Clock,
  Sparkles,
  Building,
  Filter,
} from 'lucide-react';

export default function ApplicationsPage() {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [applications, setApplications] = useState<SavedApplication[]>([]);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [templates, setTemplates] = useState<ResumeTemplate[]>(BUILT_IN_TEMPLATES);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  useEffect(() => {
    setMounted(true);
    setTemplates(repository.getTemplates());

    if (!user?.sub) {
      setApplications([]);
      setProfile(DEFAULT_PROFILE);
      return;
    }

    setApplications(repository.getApplications(user.sub));
    setProfile(repository.getProfile(user.sub));

    // Sync seamlessly with MongoDB Atlas
    repository.syncApplicationsFromDb(user.sub).then((synced) => {
      if (synced && synced.length > 0) setApplications(synced);
    });
  }, [user?.sub]);

  const handleDelete = (id: string) => {
    if (confirm('Delete this saved application?')) {
      repository.deleteApplication(id, user?.sub);
      setApplications(repository.getApplications(user?.sub));
    }
  };

  const handleStatusChange = (id: string, status: SavedApplication['status']) => {
    const app = applications.find((a) => a.id === id);
    if (!app) return;
    const updated = { ...app, status, updatedAt: new Date().toISOString() };
    repository.saveApplication(updated, user?.sub);
    setApplications(repository.getApplications(user?.sub));
  };

  const downloadDocx = async (app: SavedApplication) => {
    const resume = repository.getTailoredResumeById(app.tailoredResumeId);
    if (!resume) {
      alert('Resume snapshot not found.');
      return;
    }
    const template = templates.find((t) => t.id === app.templateId) || templates[0];
    try {
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
      a.download = `${profile.personalInfo.fullName.replace(/\s+/g, '_')}_${app.companyName}_Resume.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert('Could not download DOCX.');
    }
  };

  const downloadPdf = async (app: SavedApplication) => {
    const resume = repository.getTailoredResumeById(app.tailoredResumeId);
    if (!resume) {
      alert('Resume snapshot not found.');
      return;
    }
    const template = templates.find((t) => t.id === app.templateId) || templates[0];
    try {
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
      a.download = `${profile.personalInfo.fullName.replace(/\s+/g, '_')}_${app.companyName}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert('Could not download PDF.');
    }
  };

  const filteredApps =
    filterStatus === 'All'
      ? applications
      : applications.filter((a) => a.status === filterStatus);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6 w-full max-w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white border border-[#E5E5E7] p-4 sm:p-6 rounded-2xl md:rounded-xl shadow-apple-card max-w-full">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#0066CC] shrink-0" />
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#1D1D1F]">
                My Saved Applications
              </h1>
            </div>
            <p className="text-xs text-[#555555] mt-1 leading-relaxed">
              Track job applications, match relevance, and immutable tailored resume snapshots. Updating your profile never alters previously generated resumes.
            </p>
          </div>

          <Link href="/tailor" className="self-start md:self-auto">
            <Button size="sm" pill icon={<Sparkles className="w-3.5 h-3.5 shrink-0" />} className="font-semibold">
              Tailor New Resume
            </Button>
          </Link>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 max-w-full">
          {['All', 'Applied', 'Interviewing', 'Offer', 'Draft', 'Archived'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 active:scale-95 touch-manipulation ${
                filterStatus === status
                  ? 'bg-[#0066CC] text-white shadow-xs font-semibold'
                  : 'bg-white border border-[#E5E5E7] text-[#1D1D1F] hover:bg-[#F5F5F7]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Applications List */}
        <div className="space-y-3 max-w-full">
          {filteredApps.length === 0 ? (
            <Card className="text-center py-12 space-y-3">
              <Building className="w-10 h-10 text-[#AAAAAA] mx-auto opacity-50" />
              <p className="text-xs text-[#555555]">No job applications saved yet.</p>
              <Link href="/tailor">
                <Button size="sm" pill>
                  Tailor and save your first job application
                </Button>
              </Link>
            </Card>
          ) : (
            filteredApps.map((app) => (
              <Card key={app.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5 max-w-full">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h3 className="font-semibold text-sm text-[#1D1D1F] truncate" title={app.jobTitle}>
                      {app.jobTitle}
                    </h3>
                    <span className="text-xs text-[#555555]">at</span>
                    <span className="font-semibold text-sm text-[#0066CC] truncate" title={app.companyName}>
                      {app.companyName}
                    </span>
                    <Badge variant="available" size="sm">
                      {app.relevanceScore}% Match
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#666666]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#777777]" />
                      Applied: {mounted ? new Date(app.createdAt).toLocaleDateString() : ''}
                    </span>
                    {app.location && <span>• {app.location}</span>}
                    {app.jobUrl && (
                      <a
                        href={app.jobUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#0066CC] hover:underline flex items-center gap-1"
                      >
                        Listing <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E5E5E7]">
                  <select
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value as any)}
                    className="text-xs px-2.5 py-1.5 min-h-[36px] bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl text-[#1D1D1F] font-medium"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Offer">Offer</option>
                    <option value="Archived">Archived</option>
                  </select>

                  <Link href={`/tailor?resumeId=${app.tailoredResumeId}&appId=${app.id}`}>
                    <Button
                      size="sm"
                      pill
                      icon={<Sparkles className="w-3.5 h-3.5 shrink-0" />}
                      className="px-3"
                    >
                      View Resume
                    </Button>
                  </Link>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => downloadPdf(app)}
                    icon={<Download className="w-3.5 h-3.5 shrink-0" />}
                  >
                    PDF
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => downloadDocx(app)}
                    icon={<Download className="w-3.5 h-3.5 shrink-0" />}
                  >
                    DOCX
                  </Button>

                  <button
                    onClick={() => handleDelete(app.id)}
                    className="p-2 text-rose-500 hover:text-rose-700 rounded-xl hover:bg-rose-50 transition-colors active:scale-95 touch-manipulation"
                    title="Delete Application"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
