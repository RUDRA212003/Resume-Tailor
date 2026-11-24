'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useAuthModal } from '@/context/AuthModalContext';
import {
  LayoutDashboard,
  UserCheck,
  Sparkles,
  Briefcase,
  Menu,
  X,
  FileSpreadsheet,
  History,
  Settings,
  ShieldCheck,
  Database,
  CheckCircle2,
  ChevronRight,
  LogIn,
  LogOut,
  User as UserIcon,
  Download,
} from 'lucide-react';
import { repository } from '@/lib/storage/repository';
import { haptics } from '@/lib/haptics';
import { usePwa } from '@/context/PwaContext';

interface BottomNavProps {
  profileName?: string;
  dbConnected?: boolean | null;
  aiStatus?: { configured: boolean; label: string; model?: string } | null;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  profileName = 'Guest',
  dbConnected = null,
  aiStatus = null,
}) => {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { user } = useUser();
  const { requireAuth } = useAuthModal();
  const { isInstallable, isInstalled, promptInstall } = usePwa();

  const handleTabClick = (e: React.MouseEvent, href: string, name: string) => {
    haptics.selection();
    if (href !== '/dashboard' && !user) {
      e.preventDefault();
      requireAuth(href, name);
    }
  };

  const handleMoreItemClick = (e: React.MouseEvent, href: string, name: string) => {
    haptics.selection();
    setIsMoreOpen(false);
    if (!user) {
      e.preventDefault();
      requireAuth(href, name);
    }
  };

  const handleLogout = () => {
    if (user?.sub) {
      repository.clearUserCache(user.sub);
    } else {
      repository.clearUserCache();
    }
  };

  const mainTabs = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: UserCheck,
    },
    {
      name: 'Tailor',
      href: '/tailor',
      icon: Sparkles,
      isSpecial: true,
    },
    {
      name: 'Applications',
      href: '/applications',
      icon: Briefcase,
    },
  ];

  const moreItems = [
    {
      name: 'Resume Templates',
      href: '/templates',
      icon: FileSpreadsheet,
      desc: 'Browse Executive, Modern & Single-Page ATS formats',
    },
    {
      name: 'Generation History',
      href: '/history',
      icon: History,
      desc: 'View previously generated resumes and diffs',
    },
    {
      name: 'Settings & AI',
      href: '/settings',
      icon: Settings,
      desc: 'Gemini API keys, privacy & MongoDB settings',
    },
  ];

  const isMoreActive =
    pathname === '/templates' ||
    pathname === '/history' ||
    pathname === '/settings';

  return (
    <>
      {/* Slide-up "More" Drawer / Bottom Sheet */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => {
              haptics.selection();
              setIsMoreOpen(false);
            }}
          />

          {/* Sheet Content */}
          <div className="relative bg-white rounded-t-3xl border-t border-[#E5E5E7] shadow-2xl p-5 max-h-[88vh] pb-safe overflow-y-auto z-10 animate-in slide-in-from-bottom duration-250 ease-out">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-[#D1D1D6] rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7]">
              <div>
                <h3 className="font-bold text-base text-[#1D1D1F]">Menu &amp; Tools</h3>
                <p className="text-xs text-[#666666]">Additional views &amp; platform settings</p>
              </div>
              <button
                onClick={() => {
                  haptics.selection();
                  setIsMoreOpen(false);
                }}
                className="w-9 h-9 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#555555] active:scale-90 touch-manipulation transition-all"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Candidate & Verification Info */}
            <div className="my-4 p-3.5 bg-[#F0F7FF] rounded-xl border border-[#0066CC]/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1D1D1F]">
                  {user ? 'Authenticated Account' : 'Verified Profile'}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {user?.name || profileName}
                </span>
              </div>

              {user ? (
                <div className="flex items-center justify-between pt-1 border-t border-[#0066CC]/10">
                  <div className="text-[11px] text-[#555555] truncate max-w-[200px]">
                    {user.email || user.sub}
                  </div>
                  <a
                    href="/auth/logout"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700"
                  >
                    <LogOut className="w-3 h-3" />
                    Sign Out
                  </a>
                </div>
              ) : (
                <div className="pt-1 border-t border-[#0066CC]/10">
                  <a
                    href="/auth/login"
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-[#0066CC] text-white text-xs font-semibold"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Sign In / Register
                  </a>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                {dbConnected !== null && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                      dbConnected
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-amber-700 bg-amber-50 border-amber-200'
                    }`}
                  >
                    <Database className="w-2.5 h-2.5" />
                    {dbConnected ? 'MongoDB Atlas Online' : 'Local Cache'}
                  </span>
                )}

                {aiStatus !== null && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                      aiStatus.configured
                        ? 'text-indigo-700 bg-indigo-50 border-indigo-200'
                        : 'text-blue-700 bg-blue-50 border-blue-200'
                    }`}
                  >
                    <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                    {aiStatus.configured ? 'Gemini AI Active' : 'Local Rule Engine'}
                  </span>
                )}
              </div>
            </div>

            {/* Navigation links in drawer */}
            <div className="space-y-1.5 my-3">
              {moreItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => handleMoreItemClick(e, item.href, item.name)}
                    className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-[#F0F7FF] text-[#0066CC] font-semibold border border-[#0066CC]/20'
                        : 'hover:bg-[#F5F5F7] text-[#1D1D1F] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          isActive
                            ? 'bg-[#0066CC] text-white'
                            : 'bg-[#F5F5F7] text-[#555555]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{item.name}</div>
                        <div className="text-[11px] text-[#666666]">{item.desc}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#999999]" />
                  </Link>
                );
              })}

              {/* Install Mobile App Prompt in More Drawer */}
              {isInstallable && !isInstalled && (
                <button
                  onClick={() => {
                    haptics.light();
                    setIsMoreOpen(false);
                    promptInstall();
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#0066CC]/25 bg-[#F0F7FF] text-[#0066CC] hover:bg-blue-100/60 transition-all text-left mt-2 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#0066CC] text-white flex items-center justify-center shadow-xs">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#1D1D1F]">Install Resume Tailor</div>
                      <div className="text-[11px] text-[#555555]">Add to home screen for native app experience</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#0066CC]" />
                </button>
              )}
            </div>

            {/* Factual Truth Guarantee Badge */}
            <div className="p-3.5 mt-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#0066CC]">
                <ShieldCheck className="w-4 h-4" />
                <span>Factual Truth Guarantee</span>
              </div>
              <p className="text-[11px] text-[#555555] leading-relaxed">
                Zero hallucinations. Resumes and cover letters are strictly grounded in your verified facts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Premium Native-Feel iOS/Android Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Application Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-[#E5E5E7] shadow-[0_-4px_24px_rgba(0,0,0,0.07)] pb-safe select-none"
      >
        <div className="flex items-center justify-around h-16 px-1.5 max-w-md mx-auto w-full relative">
          {/* Dashboard and Profile */}
          {mainTabs.slice(0, 2).map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={(e) => handleTabClick(e, tab.href, tab.name)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 text-center transition-all duration-200 relative group touch-manipulation active:scale-95 ${
                  isActive
                    ? 'text-[#0066CC]'
                    : 'text-[#666666] hover:text-[#1D1D1F]'
                }`}
              >
                <div
                  className={`flex flex-col items-center justify-center px-3 py-1 rounded-2xl transition-all duration-200 ${
                    isActive ? 'bg-[#0066CC]/10' : ''
                  }`}
                >
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 ${
                        isActive ? 'scale-110 text-[#0066CC]' : 'text-[#666666]'
                      }`}
                    />
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#0066CC] shadow-xs animate-in zoom-in-75 duration-200" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-0.5 tracking-tight transition-all ${
                      isActive ? 'font-bold text-[#0066CC]' : 'font-medium text-[#666666]'
                    }`}
                  >
                    {tab.name}
                  </span>
                </div>
              </Link>
            );
          })}

          {/* Elevated Center Floating Action Button: Tailor Studio */}
          <Link
            href="/tailor"
            onClick={(e) => handleTabClick(e, '/tailor', 'Tailor Studio')}
            aria-current={pathname === '/tailor' ? 'page' : undefined}
            className="flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-0 relative -top-2 group touch-manipulation active:scale-90 transition-transform duration-150"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ring-4 ring-white ${
                pathname === '/tailor'
                  ? 'bg-gradient-to-tr from-[#0052A3] to-[#0066CC] text-white shadow-blue-500/40 ring-blue-100/80 scale-105'
                  : 'bg-gradient-to-tr from-[#0066CC] via-[#0071E3] to-[#2997FF] text-white shadow-blue-500/30 hover:shadow-blue-500/50'
              }`}
            >
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <span
              className={`text-[10px] mt-0.5 font-bold tracking-tight transition-colors ${
                pathname === '/tailor' ? 'text-[#0066CC]' : 'text-[#1D1D1F]'
              }`}
            >
              Tailor
            </span>
          </Link>

          {/* Applications */}
          {mainTabs.slice(3).map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={(e) => handleTabClick(e, tab.href, tab.name)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 text-center transition-all duration-200 relative group touch-manipulation active:scale-95 ${
                  isActive
                    ? 'text-[#0066CC]'
                    : 'text-[#666666] hover:text-[#1D1D1F]'
                }`}
              >
                <div
                  className={`flex flex-col items-center justify-center px-3 py-1 rounded-2xl transition-all duration-200 ${
                    isActive ? 'bg-[#0066CC]/10' : ''
                  }`}
                >
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 ${
                        isActive ? 'scale-110 text-[#0066CC]' : 'text-[#666666]'
                      }`}
                    />
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#0066CC] shadow-xs animate-in zoom-in-75 duration-200" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-0.5 tracking-tight transition-all ${
                      isActive ? 'font-bold text-[#0066CC]' : 'font-medium text-[#666666]'
                    }`}
                  >
                    {tab.name}
                  </span>
                </div>
              </Link>
            );
          })}

          {/* More Menu Trigger */}
          <button
            onClick={() => {
              haptics.impactMedium();
              setIsMoreOpen(true);
            }}
            aria-expanded={isMoreOpen}
            aria-label="Open more menu"
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 text-center transition-all duration-200 relative group touch-manipulation active:scale-95 ${
              isMoreActive || isMoreOpen
                ? 'text-[#0066CC]'
                : 'text-[#666666] hover:text-[#1D1D1F]'
            }`}
          >
            <div
              className={`flex flex-col items-center justify-center px-3 py-1 rounded-2xl transition-all duration-200 ${
                isMoreActive || isMoreOpen ? 'bg-[#0066CC]/10' : ''
              }`}
            >
              <div className="relative">
                <Menu
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isMoreActive || isMoreOpen ? 'scale-110 text-[#0066CC]' : 'text-[#666666]'
                  }`}
                />
                {isMoreActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#0066CC] shadow-xs animate-in zoom-in-75 duration-200" />
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight transition-all ${
                  isMoreActive || isMoreOpen ? 'font-bold text-[#0066CC]' : 'font-medium text-[#666666]'
                }`}
              >
                More
              </span>
            </div>
          </button>
        </div>
      </nav>
    </>
  );
};
