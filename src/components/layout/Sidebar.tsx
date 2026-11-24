'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import {
  LayoutDashboard,
  UserCheck,
  FileSpreadsheet,
  Sparkles,
  Briefcase,
  History,
  Settings,
  ShieldCheck,
  LogIn,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { repository } from '@/lib/storage/repository';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    name: 'My Profile',
    href: '/profile',
    icon: <UserCheck className="w-5 h-5" />,
  },
  {
    name: 'Resume Templates',
    href: '/templates',
    icon: <FileSpreadsheet className="w-5 h-5" />,
  },
  {
    name: 'Tailor My Resume',
    href: '/tailor',
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    name: 'My Applications',
    href: '/applications',
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    name: 'Generation History',
    href: '/history',
    icon: <History className="w-5 h-5" />,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: <Settings className="w-5 h-5" />,
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, isLoading } = useUser();

  const handleLogout = () => {
    if (user?.sub) {
      repository.clearUserCache(user.sub);
    } else {
      repository.clearUserCache();
    }
  };

  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-[#E5E5E7] flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#E5E5E7] flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#0066CC] flex items-center justify-center text-white shadow-sm">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-semibold text-base tracking-tight text-[#1D1D1F]">
            ResumeCraft
          </h1>
          <p className="text-[11px] text-[#555555] font-medium">
            AI Tailoring Studio
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#F0F7FF] text-[#0066CC] font-semibold'
                  : 'text-[#1D1D1F] hover:bg-[#F5F5F7] hover:text-[#0066CC]'
              }`}
            >
              <span
                className={`transition-colors ${
                  isActive ? 'text-[#0066CC]' : 'text-[#666666]'
                }`}
              >
                {item.icon}
              </span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Ground Truth Guarantee Footer Badge */}
      <div className="p-3 mx-3 mb-2 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]/70 text-xs text-[#1D1D1F]">
        <div className="flex items-center gap-1.5 font-semibold text-[#0066CC] mb-1">
          <ShieldCheck className="w-4 h-4 text-[#0066CC]" />
          <span>Factual Truth Guarantee</span>
        </div>
        <p className="text-[11px] leading-relaxed text-[#555555]">
          Zero hallucinations. Resumes strictly grounded in verified profile facts.
        </p>
      </div>

      {/* User Account / Auth0 Bar */}
      <div className="p-3 border-t border-[#E5E5E7] bg-white">
        {user ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || 'User'}
                  className="w-8 h-8 rounded-full border border-[#E5E5E7] object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#0066CC]/10 text-[#0066CC] font-bold text-xs flex items-center justify-center shrink-0">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-[#1D1D1F] truncate">
                  {user.name || 'Logged In'}
                </div>
                <div className="text-[10px] text-[#666666] truncate">
                  {user.email || user.sub}
                </div>
              </div>
            </div>
            <a
              href="/auth/logout"
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 rounded-lg text-[#666666] hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <a
            href="/auth/login"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-[#0066CC] text-white text-xs font-semibold hover:bg-[#0052A3] transition-colors shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In / Sign Up</span>
          </a>
        )}
      </div>
    </aside>
  );
};
