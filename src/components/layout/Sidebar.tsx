'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UserCheck,
  FileSpreadsheet,
  Sparkles,
  Briefcase,
  History,
  Settings,
  ShieldCheck,
} from 'lucide-react';

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
      <div className="p-4 m-3 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]/70 text-xs text-[#1D1D1F]">
        <div className="flex items-center gap-1.5 font-semibold text-[#0066CC] mb-1">
          <ShieldCheck className="w-4 h-4 text-[#0066CC]" />
          <span>Factual Truth Guarantee</span>
        </div>
        <p className="text-[11px] leading-relaxed text-[#555555]">
          Zero hallucinations. Resumes strictly grounded in your verified profile facts.
        </p>
      </div>
    </aside>
  );
};
