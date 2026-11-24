'use client';

import React from 'react';
import { useAuthModal } from '@/context/AuthModalContext';
import {
  ShieldCheck,
  Lock,
  Sparkles,
  X,
  LogIn,
  CheckCircle2,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const LoginPromptModal: React.FC = () => {
  const { isOpen, closeLoginPrompt, targetHref, featureName } = useAuthModal();

  if (!isOpen) return null;

  const loginUrl = `/auth/login?returnTo=${encodeURIComponent(targetHref || '/dashboard')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={closeLoginPrompt}
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-white rounded-2xl border border-[#E5E5E7] shadow-2xl max-w-md w-full p-6 z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Top Decorative Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0066CC] via-[#2997FF] to-[#0052A3]" />

        {/* Close Button */}
        <button
          onClick={closeLoginPrompt}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#888888] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center mt-2">
          <div className="w-14 h-14 rounded-2xl bg-[#F0F7FF] border border-[#0066CC]/20 flex items-center justify-center text-[#0066CC] mb-4 shadow-sm">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#1D1D1F]">
            Sign In Required
          </h2>
          <p className="text-sm text-[#555555] mt-1.5 max-w-xs">
            Please sign in to access <span className="font-semibold text-[#1D1D1F]">{featureName}</span> and your personal workspace.
          </p>
        </div>

        {/* Benefits Checklist */}
        <div className="my-5 p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]/70 space-y-2.5 text-xs text-[#1D1D1F]">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0066CC] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#1D1D1F]">Private Multi-User Workspace</span>
              <p className="text-[11px] text-[#666666] leading-relaxed">
                Your tailored resumes, uploaded CVs, and job descriptions are strictly isolated to your account.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Database className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#1D1D1F]">Persistent Cloud Storage</span>
              <p className="text-[11px] text-[#666666] leading-relaxed">
                All records, ATS scores, and history are securely synced to your MongoDB Atlas profile.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#1D1D1F]">Factual Truth Guarantee</span>
              <p className="text-[11px] text-[#666666] leading-relaxed">
                Zero hallucinations. Resumes are strictly grounded in your verified career accomplishments.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <a
            href={loginUrl}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-[#0066CC] text-white text-sm font-semibold hover:bg-[#0052A3] transition-colors shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In / Create Free Account</span>
          </a>

          <button
            onClick={closeLoginPrompt}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-[#666666] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
          >
            Cancel and Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};
