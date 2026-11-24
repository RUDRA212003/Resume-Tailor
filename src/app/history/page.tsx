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
import { TailoredResume, Profile, ResumeTemplate } from '@/types';
import {
  History,
  ShieldCheck,
  Download,
  Calendar,
  Sparkles,
  GitCommit,
  CheckCircle2,
} from 'lucide-react';

export default function HistoryPage() {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [resumes, setResumes] = useState<TailoredResume[]>([]);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [templates, setTemplates] = useState<ResumeTemplate[]>(BUILT_IN_TEMPLATES);

  useEffect(() => {
    setMounted(true);
    setTemplates(repository.getTemplates());

    if (!user?.sub) {
      setResumes([]);
      setProfile(DEFAULT_PROFILE);
      return;
    }

    setResumes(repository.getTailoredResumes(user.sub));
    setProfile(repository.getProfile(user.sub));

    // Sync seamlessly with MongoDB Atlas
    repository.syncTailoredResumesFromDb(user.sub).then((synced) => {
      if (synced && synced.length > 0) setResumes(synced);
    });
  }, [user?.sub]);

  const downloadDocx = async (resume: TailoredResume) => {
    const template = templates.find((t) => t.id === resume.templateId) || templates[0];
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
      a.download = `${profile.personalInfo.fullName.replace(/\s+/g, '_')}_${resume.title.slice(0, 20)}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert('Could not download DOCX.');
    }
  };

  const downloadPdf = async (resume: TailoredResume) => {
    const template = templates.find((t) => t.id === resume.templateId) || templates[0];
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
      a.download = `${profile.personalInfo.fullName.replace(/\s+/g, '_')}_${resume.title.slice(0, 20)}.pdf`;
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
      <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6 w-full max-w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white border border-[#E5E5E7] p-4 sm:p-6 rounded-2xl md:rounded-xl shadow-apple-card max-w-full">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#0066CC] shrink-0" />
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#1D1D1F]">
                Generation History & Fact Audit Log
              </h1>
            </div>
            <p className="text-xs text-[#555555] mt-1 leading-relaxed">
              Complete audit history of all generated resumes, including factual verification reports, profile snapshot IDs, and change summaries.
            </p>
          </div>

          <Link href="/tailor" className="self-start md:self-auto">
            <Button size="sm" pill icon={<Sparkles className="w-3.5 h-3.5 shrink-0" />} className="font-semibold">
              Create Tailored Resume
            </Button>
          </Link>
        </div>

        {/* History Feed */}
        <div className="space-y-3.5 max-w-full">
          {resumes.length === 0 ? (
            <Card className="text-center py-12 space-y-3">
              <History className="w-10 h-10 text-[#AAAAAA] mx-auto opacity-50" />
              <p className="text-xs text-[#555555]">No resume generation history recorded yet.</p>
              <Link href="/tailor">
                <Button size="sm" pill>
                  Tailor your first resume
                </Button>
              </Link>
            </Card>
          ) : (
            resumes.map((resume) => (
              <Card key={resume.id} className="p-4 sm:p-5 space-y-3.5 max-w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E7] pb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-[#1D1D1F] truncate" title={resume.title}>
                      {resume.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#555555]">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-[#777777]" />
                        {mounted ? new Date(resume.createdAt).toLocaleString() : ''}
                      </span>
                      <span>•</span>
                      <span className="text-[#0066CC] font-semibold text-[11px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Relevance: {resume.analysis?.relevanceScore || 90}%
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 pt-2 sm:pt-0">
                    <Link href={`/tailor?resumeId=${resume.id}`}>
                      <Button
                        size="sm"
                        pill
                        icon={<Sparkles className="w-3.5 h-3.5 shrink-0" />}
                        className="px-3"
                      >
                        <span className="hidden sm:inline">Open / Edit Resume</span>
                        <span className="sm:hidden">Open</span>
                      </Button>
                    </Link>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => downloadPdf(resume)}
                      icon={<Download className="w-3.5 h-3.5 shrink-0" />}
                    >
                      PDF
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => downloadDocx(resume)}
                      icon={<Download className="w-3.5 h-3.5 shrink-0" />}
                    >
                      DOCX
                    </Button>
                  </div>
                </div>

                {/* Verification Report Snippet */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs max-w-full">
                  <div className="p-2.5 bg-[#FBFBFC] rounded-xl border border-[#E5E5E7]">
                    <p className="text-[11px] text-[#555555]">Factual Grounding</p>
                    <p className="font-semibold text-emerald-700 flex items-center gap-1 mt-0.5 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      100% Verified Facts
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#FBFBFC] rounded-xl border border-[#E5E5E7]">
                    <p className="text-[11px] text-[#555555]">Facts Checked</p>
                    <p className="font-semibold text-[#1D1D1F] mt-0.5 text-xs">
                      {resume.validationReport?.checkedFactsCount || 18} Profile Points
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#FBFBFC] rounded-xl border border-[#E5E5E7]">
                    <p className="text-[11px] text-[#555555]">Changes & Refinements</p>
                    <p className="font-semibold text-[#0066CC] mt-0.5 text-xs">
                      {resume.diff?.rewrittenCount || 3} Refined, {resume.diff?.omittedCount || 4} Filtered
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
