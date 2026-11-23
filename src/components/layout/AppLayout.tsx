'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import Link from 'next/link';
import { Sparkles, CheckCircle2, Database } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { repository } from '@/lib/storage/repository';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [profileName, setProfileName] = React.useState('RUDRESH M');
  const [dbConnected, setDbConnected] = React.useState<boolean | null>(null);
  const [aiStatus, setAiStatus] = React.useState<{ configured: boolean; label: string; model?: string } | null>(null);

  React.useEffect(() => {
    try {
      const p = repository.getProfile();
      if (p?.personalInfo?.fullName) {
        setProfileName(p.personalInfo.fullName);
      }
    } catch (e) {
      // ignore
    }

    fetch('/api/db/status')
      .then((res) => res.json())
      .then((data) => setDbConnected(Boolean(data.connected)))
      .catch(() => setDbConnected(false));

    fetch('/api/ai/status')
      .then((res) => res.json())
      .then((data) => setAiStatus(data))
      .catch(() => setAiStatus({ configured: false, label: 'Local Engine Active' }));
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F5F5F7]">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="no-print hidden md:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header (< md) */}
        <header className="no-print flex md:hidden h-14 bg-white/90 backdrop-blur-md border-b border-[#E5E5E7] px-4 items-center justify-between sticky top-0 z-30">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0066CC] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-[#1D1D1F] leading-tight">
                ResumeCraft
              </span>
              <span className="text-[10px] text-[#666666] leading-none">
                AI Studio
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              {profileName.split(' ')[0]}
            </span>

            <Link href="/tailor">
              <Button size="sm" pill icon={<Sparkles className="w-3 h-3" />} className="text-xs px-2.5 py-1">
                Tailor
              </Button>
            </Link>
          </div>
        </header>

        {/* Desktop Header (>= md) */}
        <header className="no-print hidden md:flex h-14 bg-white/80 backdrop-blur-md border-b border-[#E5E5E7] px-8 items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3 text-xs text-[#555555]">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#1D1D1F]">Central Repository:</span>
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                {profileName} (Verified)
              </span>
            </div>

            {dbConnected !== null && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
                  dbConnected
                    ? 'text-emerald-700 bg-emerald-50/60 border-emerald-200'
                    : 'text-amber-700 bg-amber-50/60 border-amber-200'
                }`}
              >
                <Database className="w-2.5 h-2.5" />
                {dbConnected ? 'MongoDB Atlas Active' : 'Local Cache Mode'}
              </span>
            )}

            {aiStatus !== null && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border ${
                  aiStatus.configured
                    ? 'text-indigo-700 bg-indigo-50 border-indigo-200 font-medium'
                    : 'text-blue-700 bg-blue-50/70 border-blue-200'
                }`}
              >
                <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                {aiStatus.configured
                  ? `Gemini AI Active (${aiStatus.model || 'Flash'})`
                  : 'Local High-Speed Engine'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/tailor">
              <Button size="sm" pill icon={<Sparkles className="w-3.5 h-3.5" />}>
                Create Tailored Resume
              </Button>
            </Link>
          </div>
        </header>

        {/* Main Content Area: Responsive padding with room for bottom bar */}
        <main className="flex-1 px-3.5 py-4 sm:px-6 sm:py-6 md:p-8 pb-24 md:pb-8 overflow-y-auto overflow-x-hidden min-w-0 print:p-0 print:overflow-visible">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar (< md) */}
        <div className="no-print">
          <BottomNav
            profileName={profileName}
            dbConnected={dbConnected}
            aiStatus={aiStatus}
          />
        </div>
      </div>
    </div>
  );
};
