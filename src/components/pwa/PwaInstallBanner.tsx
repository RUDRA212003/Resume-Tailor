'use client';

import React from 'react';
import { usePwa } from '@/context/PwaContext';
import { Button } from '@/components/ui/Button';
import {
  Download,
  Share,
  PlusSquare,
  X,
  WifiOff,
  Sparkles,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { haptics } from '@/lib/haptics';

export const PwaInstallBanner: React.FC = () => {
  const {
    shouldShowBanner,
    isIos,
    isOffline,
    promptInstall,
    dismissBanner,
    showIosGuide,
    setShowIosGuide,
  } = usePwa();

  return (
    <>
      {/* 1. Offline Notification Bar (Sticky Top) */}
      {isOffline && (
        <div
          role="alert"
          className="fixed top-0 inset-x-0 z-50 bg-[#FFF3E0] border-b border-[#FFE082] px-4 py-2 text-xs text-[#E65100] flex items-center justify-center gap-2 shadow-sm animate-in slide-in-from-top duration-300 select-none"
        >
          <WifiOff className="w-4 h-4 shrink-0 text-[#E65100]" />
          <span className="font-medium">
            You are currently offline. AI resume tailoring and cloud syncing require an active internet connection.
          </span>
        </div>
      )}

      {/* 2. Floating Custom Install Banner (Android / Desktop / Mobile) */}
      {shouldShowBanner && !showIosGuide && (
        <aside
          aria-label="Install Application Suggestion"
          className="no-print fixed bottom-20 md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:max-w-md z-40 bg-white border border-[#E5E5E7] p-4 rounded-2xl shadow-apple-hover flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#0066CC] flex items-center justify-center text-white shrink-0 shadow-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[#1D1D1F] tracking-tight">
                  Install Resume Tailor
                </h2>
                <p className="text-xs text-[#555555] leading-snug mt-0.5">
                  Get a faster, app-like experience. Access your resume workspace directly from your home screen.
                </p>
              </div>
            </div>

            <button
              onClick={dismissBanner}
              aria-label="Dismiss install suggestion"
              className="p-1 rounded-full text-[#888888] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#F0F0F2]">
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissBanner}
              className="text-xs text-[#666666]"
            >
              Not Now
            </Button>
            <Button
              size="sm"
              pill
              onClick={() => promptInstall()}
              icon={isIos ? <Smartphone className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              className="text-xs px-4"
            >
              {isIos ? 'How to Install' : 'INSTALL APP'}
            </Button>
          </div>
        </aside>
      )}

      {/* 3. iOS Safari Native-Feel Installation Instructions Bottom Sheet */}
      {showIosGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          className="no-print fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-[#E5E5E7] space-y-5 animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0066CC] flex items-center justify-center text-white shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="ios-install-title" className="text-sm font-bold text-[#1D1D1F]">
                    Install on iPhone / iPad
                  </h3>
                  <p className="text-[11px] text-[#666666]">
                    Add Resume Tailor to your Home Screen in 3 steps
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  haptics.light();
                  setShowIosGuide(false);
                }}
                className="p-1.5 rounded-full text-[#888888] hover:bg-[#F5F5F7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step-by-step Guide */}
            <div className="space-y-3.5 text-xs text-[#1D1D1F]">
              <div className="flex items-start gap-3 p-3 bg-[#F5F5F7] rounded-xl">
                <div className="w-6 h-6 rounded-full bg-[#0066CC] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">Tap the Share icon in Safari</p>
                  <p className="text-[#666666] leading-relaxed">
                    Located in the browser bar at the bottom of your screen (or top on iPad).
                  </p>
                  <div className="inline-flex items-center gap-1.5 text-[#0066CC] font-medium pt-0.5">
                    <Share className="w-3.5 h-3.5" />
                    <span>Safari Share Button</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-[#F5F5F7] rounded-xl">
                <div className="w-6 h-6 rounded-full bg-[#0066CC] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">Select &ldquo;Add to Home Screen&rdquo;</p>
                  <p className="text-[#666666] leading-relaxed">
                    Scroll down through the share options menu and tap the Add to Home Screen action.
                  </p>
                  <div className="inline-flex items-center gap-1.5 text-[#0066CC] font-medium pt-0.5">
                    <PlusSquare className="w-3.5 h-3.5" />
                    <span>Add to Home Screen</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-[#F5F5F7] rounded-xl">
                <div className="w-6 h-6 rounded-full bg-[#0066CC] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">Tap &ldquo;Add&rdquo; in the top-right corner</p>
                  <p className="text-[#666666] leading-relaxed">
                    Resume Tailor will appear on your device home screen as a standalone application.
                  </p>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="pt-2">
              <Button
                size="md"
                className="w-full justify-center"
                pill
                onClick={() => {
                  haptics.success();
                  setShowIosGuide(false);
                }}
              >
                Got It
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
