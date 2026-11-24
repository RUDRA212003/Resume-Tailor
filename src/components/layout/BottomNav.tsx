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
} from 'lucide-react';
import { repository } from '@/lib/storage/repository';

interface BottomNavProps {
  profileName?: string;
  dbConnected?: boolean | null;
  aiStatus?: { configured: boolean; label: string; model?: string } | null;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  profileName = 'RUDRESH M',
  dbConnected = null,
  aiStatus = null,
}) => {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { user } = useUser();
  const { requireAuth } = useAuthModal();

  const handleTabClick = (e: React.MouseEvent, href: string, name: string) => {
    if (href !== '/dashboard' && !user) {
      e.preventDefault();
      requireAuth(href, name);
    }
  };

  const handleMoreItemClick = (e: React.MouseEvent, href: string, name: string) => {
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
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMoreOpen(false)}
          />

          {/* Sheet Content */}
          <div className="relative bg-white rounded-t-2xl border-t border-[#E5E5E7] shadow-2xl p-5 max-h-[85vh] overflow-y-auto z-10 animate-in slide-in-from-bottom duration-200">
            {/* Grab Handle */}
            <div className="w-10 h-1 bg-[#D1D1D6] rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7]">
              <div>
                <h3 className="font-bold text-base text-[#1D1D1F]">Menu &amp; Tools</h3>
                <p className="text-xs text-[#666666]">Additional views &amp; platform settings</p>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#555555] active:scale-95"
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

      {/* Modern iOS-Style Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-[#E5E5E7] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe select-none"
      >
        <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
          {/* Dashboard and Profile */}
          {mainTabs.slice(0, 2).map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={(e) => handleTabClick(e, tab.href, tab.name)}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${
                  isActive
                    ? 'text-[#0066CC] font-semibold'
                    : 'text-[#666666] hover:text-[#1D1D1F]'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#0066CC]" />
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight">{tab.name}</span>
              </Link>
            );
          })}

          {/* Elevated Center Action Button: Tailor */}
          <Link
            href="/tailor"
            onClick={(e) => handleTabClick(e, '/tailor', 'Tailor Studio')}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 group"
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all active:scale-95 ${
                pathname === '/tailor'
                  ? 'bg-[#0066CC] text-white ring-4 ring-[#0066CC]/20 shadow-blue-500/30'
                  : 'bg-gradient-to-tr from-[#0066CC] to-[#2997FF] text-white shadow-blue-500/20 hover:shadow-blue-500/40'
              }`}
            >
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <span
              className={`text-[10px] mt-0.5 font-bold tracking-tight ${
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
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${
                  isActive
                    ? 'text-[#0066CC] font-semibold'
                    : 'text-[#666666] hover:text-[#1D1D1F]'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#0066CC]" />
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight">{tab.name}</span>
              </Link>
            );
          })}

          {/* More Menu Trigger */}
          <button
            onClick={() => setIsMoreOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${
              isMoreActive || isMoreOpen
                ? 'text-[#0066CC] font-semibold'
                : 'text-[#666666] hover:text-[#1D1D1F]'
            }`}
          >
            <div className="relative">
              <Menu className={`w-5 h-5 ${isMoreActive || isMoreOpen ? 'scale-110' : ''} transition-transform`} />
              {isMoreActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#0066CC]" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};
