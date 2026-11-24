'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { repository } from '@/lib/storage/repository';
import { DEFAULT_PROFILE, createEmptyProfile } from '@/lib/storage/defaultData';
import { haptics } from '@/lib/haptics';
import {
  Profile,
  SkillCategory,
  SKILL_CATEGORIES,
  SkillItem,
  ExperienceItem,
  ProjectItem,
  EducationItem,
  CertificationItem,
} from '@/types';
import {
  User,
  FileText,
  Code2,
  Briefcase,
  FolderGit2,
  GraduationCap,
  Award,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Save,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [savedSnapshot, setSavedSnapshot] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'personal' | 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'certifications'
  >('personal');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: 'idle' | 'success' | 'warning' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    setMounted(true);
    const local = repository.getProfile();
    setProfile(local);
    setSavedSnapshot(JSON.stringify(local));

    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.personalInfo) {
          // If legacy demo profile ("RUDRESH M"), sanitize to clean empty profile
          if (
            (data.personalInfo.fullName === 'RUDRESH M' ||
              data.personalInfo.email === 'rudreshmanjunath15@gmail.com' ||
              data.personalInfo.phone === '+91 6364152219') &&
            data.userId !== 'usr_001_demo'
          ) {
            const clean = createEmptyProfile(data.userId || '');
            setProfile(clean);
            repository.cacheProfile(clean);
            setSavedSnapshot(JSON.stringify(clean));
          } else {
            setProfile(data);
            repository.cacheProfile(data);
            setSavedSnapshot(JSON.stringify(data));
          }
        }
      })
      .catch((err) => console.log('Loaded from local cache:', err));
  }, []);

  const isDirty = mounted && savedSnapshot !== '' && JSON.stringify(profile) !== savedSnapshot;

  // Intercept window unload when unsaved changes exist
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have unsaved profile changes! Please save your changes before leaving.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Intercept in-app navigation link clicks when unsaved changes exist
  useEffect(() => {
    if (!isDirty) return;
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

      const confirmed = window.confirm(
        'You have unsaved changes in your profile!\n\nClick "Cancel" to stay on this page and save your details, or "OK" to discard and leave.'
      );
      if (!confirmed) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('click', handleLinkClick, true);
    return () => document.removeEventListener('click', handleLinkClick, true);
  }, [isDirty]);

  // Skill Add Modal State
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkill, setNewSkill] = useState<Partial<SkillItem>>({
    name: '',
    category: 'Programming Languages',
    proficiency: 'Advanced',
    aliases: [],
    isVerified: true,
  });
  const [aliasInput, setAliasInput] = useState('');

  // Experience Add Modal State
  const [isAddingExp, setIsAddingExp] = useState(false);
  const [newExp, setNewExp] = useState<Partial<ExperienceItem>>({
    company: '',
    jobTitle: '',
    employmentType: 'Full-time',
    startDate: '',
    endDate: 'Present',
    isCurrent: true,
    location: '',
    technologies: [],
    responsibilities: [],
    achievements: [],
    isVerified: true,
  });
  const [expTechInput, setExpTechInput] = useState('');
  const [respInput, setRespInput] = useState('');
  const [achInput, setAchInput] = useState('');

  // Project Add Modal State
  const [isAddingProj, setIsAddingProj] = useState(false);
  const [newProj, setNewProj] = useState<Partial<ProjectItem>>({
    title: '',
    description: '',
    technologies: [],
    bullets: [],
    achievements: [],
    keywords: [],
    isVerified: true,
  });
  const [projTechInput, setProjTechInput] = useState('');
  const [projBulletInput, setProjBulletInput] = useState('');

  const handleSave = async () => {
    if (!profile.personalInfo.fullName.trim()) {
      setActiveTab('personal');
      setSaveStatus({
        type: 'warning',
        message: 'Please enter your Full Name in Personal Info before saving.',
      });
      return;
    }
    haptics.light();
    setIsSaving(true);
    repository.saveProfile(profile);

    try {
      const res = await repository.syncProfileToDb(profile);
      if (res.success) {
        haptics.success();
        setSavedSnapshot(JSON.stringify(profile));
        setSaveStatus({
          type: 'success',
          message: 'Saved & synchronized with MongoDB Atlas!',
        });
      } else {
        haptics.warning();
        setSaveStatus({
          type: 'warning',
          message: res.error || 'Saved to local cache. Database write was not confirmed.',
        });
        if (res.data) {
          setSavedSnapshot(JSON.stringify(profile));
        }
      }
    } catch (err: any) {
      haptics.warning();
      setSaveStatus({
        type: 'warning',
        message: 'Saved to local cache. Database offline: ' + (err.message || 'Unknown error'),
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus({ type: 'idle', message: '' }), 4000);
    }
  };

  // Skill Handlers
  const addSkill = () => {
    if (!newSkill.name) return;
    const item: SkillItem = {
      id: `sk-${Date.now()}`,
      name: newSkill.name.trim(),
      category: (newSkill.category as SkillCategory) || 'Programming Languages',
      proficiency: newSkill.proficiency || 'Advanced',
      aliases: aliasInput
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      isVerified: true,
    };
    const updated = {
      ...profile,
      skills: [...profile.skills, item],
    };
    setProfile(updated);
    repository.saveProfile(updated);
    setIsAddingSkill(false);
    setNewSkill({ name: '', category: 'Programming Languages', proficiency: 'Advanced' });
    setAliasInput('');
  };

  const removeSkill = (id: string) => {
    const updated = {
      ...profile,
      skills: profile.skills.filter((s) => s.id !== id),
    };
    setProfile(updated);
    repository.saveProfile(updated);
  };

  const toggleSkillVerified = (id: string) => {
    const updated = {
      ...profile,
      skills: profile.skills.map((s) =>
        s.id === id ? { ...s, isVerified: !s.isVerified } : s
      ),
    };
    setProfile(updated);
    repository.saveProfile(updated);
  };

  // Experience Handlers
  const addExperience = () => {
    if (!newExp.company || !newExp.jobTitle) return;
    const item: ExperienceItem = {
      id: `exp-${Date.now()}`,
      company: newExp.company.trim(),
      jobTitle: newExp.jobTitle.trim(),
      employmentType: (newExp.employmentType as any) || 'Full-time',
      startDate: newExp.startDate || '2023-01',
      endDate: newExp.isCurrent ? 'Present' : newExp.endDate || '2024-01',
      isCurrent: newExp.isCurrent ?? false,
      location: newExp.location || '',
      technologies: expTechInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      responsibilities: newExp.responsibilities || [],
      achievements: newExp.achievements || [],
      isVerified: true,
    };
    const updated = {
      ...profile,
      experiences: [item, ...profile.experiences],
    };
    setProfile(updated);
    repository.saveProfile(updated);
    setIsAddingExp(false);
    setNewExp({ company: '', jobTitle: '', employmentType: 'Full-time', responsibilities: [], achievements: [] });
    setExpTechInput('');
  };

  const removeExperience = (id: string) => {
    const updated = {
      ...profile,
      experiences: profile.experiences.filter((e) => e.id !== id),
    };
    setProfile(updated);
    repository.saveProfile(updated);
  };

  // Project Handlers
  const addProject = () => {
    if (!newProj.title) return;
    const item: ProjectItem = {
      id: `proj-${Date.now()}`,
      title: newProj.title.trim(),
      description: newProj.description || '',
      technologies: projTechInput.split(',').map((t) => t.trim()).filter(Boolean),
      githubUrl: newProj.githubUrl,
      liveUrl: newProj.liveUrl,
      duration: newProj.duration,
      bullets: newProj.bullets || [],
      achievements: newProj.achievements || [],
      keywords: [],
      isVerified: true,
    };
    const updated = {
      ...profile,
      projects: [item, ...profile.projects],
    };
    setProfile(updated);
    repository.saveProfile(updated);
    setIsAddingProj(false);
    setNewProj({ title: '', description: '', bullets: [], achievements: [] });
    setProjTechInput('');
  };

  const removeProject = (id: string) => {
    const updated = {
      ...profile,
      projects: profile.projects.filter((p) => p.id !== id),
    };
    setProfile(updated);
    repository.saveProfile(updated);
  };

  // Resume file import handler
  const handleResumeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.text) {
        alert(
          `Document text extracted (${data.wordCount} words). Review your profile fields below and click Save.`
        );
      }
    } catch (err) {
      console.error(err);
      alert('Could not parse resume file.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Sticky Unsaved Changes Notification Banner */}
        {isDirty && (
          <div className="sticky top-4 z-40 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white px-5 py-3.5 rounded-xl shadow-lg border border-amber-400 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-white animate-pulse" />
              <div>
                <p className="font-semibold text-sm">Unsaved Profile Changes Detected</p>
                <p className="text-xs text-amber-100">
                  You have modified your profile. Make sure to click &quot;Save Changes Now&quot; so your details are preserved in MongoDB for future logins.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (savedSnapshot) {
                    setProfile(JSON.parse(savedSnapshot));
                  }
                }}
                className="px-3 py-1.5 text-xs font-medium bg-amber-800/60 hover:bg-amber-800 text-white rounded-lg transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-1.5 text-xs font-semibold bg-white text-amber-900 hover:bg-amber-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : 'Save Changes Now'}
              </button>
            </div>
          </div>
        )}

        {/* Top Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#E5E5E7] p-6 rounded-xl shadow-apple-card">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0066CC]" />
              <h1 className="text-xl font-bold tracking-tight text-[#1D1D1F]">
                My Profile – Central Information Repository
              </h1>
            </div>
            <p className="text-xs text-[#555555] mt-1 max-w-2xl">
              This repository is the single source of truth for all resume tailoring. The AI will strictly select and polish only facts verified here, and will never overwrite or fabricate profile data.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".docx,.pdf,.txt"
                className="hidden"
                onChange={handleResumeFileUpload}
                disabled={isImporting}
              />
              <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white text-[#1D1D1F] border border-[#E5E5E7] rounded-lg hover:bg-[#F5F5F7] transition-colors">
                <Upload className="w-3.5 h-3.5" />
                {isImporting ? 'Importing...' : 'Import Resume File'}
              </span>
            </label>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                fetch('/api/profile')
                  .then((res) => res.json())
                  .then((data) => {
                    if (data && data.personalInfo) {
                      setProfile(data);
                      repository.cacheProfile(data);
                      setSavedSnapshot(JSON.stringify(data));
                      setSaveStatus({
                        type: 'success',
                        message: 'Profile refreshed from MongoDB Atlas!',
                      });
                      setTimeout(() => setSaveStatus({ type: 'idle', message: '' }), 3000);
                    }
                  })
                  .catch(() => alert('Could not load from MongoDB.'));
              }}
            >
              Reload from MongoDB
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const reset = repository.resetProfile();
                setProfile(reset);
                setSaveStatus({
                  type: 'warning',
                  message: 'Reset to clean profile. Click Save Changes to synchronize.',
                });
                setTimeout(() => setSaveStatus({ type: 'idle', message: '' }), 4000);
              }}
            >
              Reset to Clean
            </Button>

            {saveStatus.type !== 'idle' && (
              <span
                className={`text-xs px-2.5 py-1 rounded-md border font-medium ${
                  saveStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {saveStatus.message}
              </span>
            )}

            <Button
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              icon={<Save className="w-3.5 h-3.5" />}
            >
              Save Changes
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-[#E5E5E7] overflow-x-auto no-scrollbar pb-1 text-sm font-medium">
          {[
            { id: 'personal', label: 'Personal Info', icon: <User className="w-4 h-4" /> },
            { id: 'summary', label: 'Summaries', icon: <FileText className="w-4 h-4" /> },
            { id: 'skills', label: `Skills${mounted ? ` (${profile?.skills?.length ?? 0})` : ''}`, icon: <Code2 className="w-4 h-4" /> },
            { id: 'experience', label: `Experience${mounted ? ` (${profile?.experiences?.length ?? 0})` : ''}`, icon: <Briefcase className="w-4 h-4" /> },
            { id: 'projects', label: `Projects${mounted ? ` (${profile?.projects?.length ?? 0})` : ''}`, icon: <FolderGit2 className="w-4 h-4" /> },
            { id: 'education', label: `Education${mounted ? ` (${profile?.education?.length ?? 0})` : ''}`, icon: <GraduationCap className="w-4 h-4" /> },
            { id: 'certifications', label: `Certifications${mounted ? ` (${profile?.certifications?.length ?? 0})` : ''}`, icon: <Award className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-[#0066CC] font-semibold shadow-sm border border-[#E5E5E7]'
                  : 'text-[#555555] hover:text-[#1D1D1F] hover:bg-white/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Personal Info */}
        {activeTab === 'personal' && (
          <Card className="space-y-6">
            <div className="border-b border-[#E5E5E7] pb-4">
              <h2 className="text-base font-semibold text-[#1D1D1F]">
                Personal & Professional Contact Details
              </h2>
              <p className="text-xs text-[#555555] mt-0.5">
                These contact details are automatically redacted before sending prompts to external AI providers to safeguard your privacy, and rehydrated into the final DOCX/PDF resume.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#1D1D1F] mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile.personalInfo.fullName}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      personalInfo: { ...profile.personalInfo, fullName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E5E5E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1D1D1F] mb-1">Email Address</label>
                <input
                  type="email"
                  value={profile.personalInfo.email}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      personalInfo: { ...profile.personalInfo, email: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E5E5E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1D1D1F] mb-1">Phone Number</label>
                <input
                  type="text"
                  value={profile.personalInfo.phone}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      personalInfo: { ...profile.personalInfo, phone: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E5E5E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1D1D1F] mb-1">Location</label>
                <input
                  type="text"
                  value={profile.personalInfo.location}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      personalInfo: { ...profile.personalInfo, location: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E5E5E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1D1D1F] mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  value={profile.personalInfo.linkedinUrl}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      personalInfo: { ...profile.personalInfo, linkedinUrl: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E5E5E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1D1D1F] mb-1">GitHub URL</label>
                <input
                  type="url"
                  value={profile.personalInfo.githubUrl}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      personalInfo: { ...profile.personalInfo, githubUrl: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E5E5E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-[#1D1D1F] mb-1">Portfolio or Blog URL</label>
                <input
                  type="url"
                  value={profile.personalInfo.portfolioUrl || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      personalInfo: { ...profile.personalInfo, portfolioUrl: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E5E5E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Tab 2: Summaries */}
        {activeTab === 'summary' && (
          <Card className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5E5E7] pb-4">
              <div>
                <h2 className="text-base font-semibold text-[#1D1D1F]">
                  Approved Professional Summaries
                </h2>
                <p className="text-xs text-[#555555] mt-0.5">
                  Maintain multiple approved summaries. The AI uses these as the foundation for tailoring.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {profile.summaries.map((s) => (
                <div
                  key={s.id}
                  className={`p-4 rounded-xl border transition-all ${
                    s.isDefault
                      ? 'border-[#0066CC] bg-[#F0F7FF]/30 shadow-sm'
                      : 'border-[#E5E5E7] bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#1D1D1F]">{s.title}</span>
                      {s.isDefault && <Badge variant="info" size="sm">Default</Badge>}
                    </div>
                    {!s.isDefault && (
                      <button
                        onClick={() => {
                          const updated = {
                            ...profile,
                            summaries: profile.summaries.map((item) => ({
                              ...item,
                              isDefault: item.id === s.id,
                            })),
                          };
                          setProfile(updated);
                          repository.saveProfile(updated);
                        }}
                        className="text-xs text-[#0066CC] hover:underline font-medium"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={s.content}
                    onChange={(e) => {
                      const updated = {
                        ...profile,
                        summaries: profile.summaries.map((item) =>
                          item.id === s.id ? { ...item, content: e.target.value } : item
                        ),
                      };
                      setProfile(updated);
                      repository.saveProfile(updated);
                    }}
                    className="w-full text-xs text-[#333333] leading-relaxed bg-white border border-[#E5E5E7] rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                  />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tab 3: Technical Skills */}
        {activeTab === 'skills' && (
          <Card className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E7] pb-4">
              <div>
                <h2 className="text-base font-semibold text-[#1D1D1F]">
                  Categorized Technical Skills & Aliases
                </h2>
                <p className="text-xs text-[#555555] mt-0.5">
                  Controlled skill alias matching allows equivalent names (e.g. JS = JavaScript). Skills marked with a green checkmark are verified.
                </p>
              </div>
              <Button
                size="sm"
                pill
                onClick={() => setIsAddingSkill(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Skill
              </Button>
            </div>

            {/* Add Skill Form Modal/Section */}
            {isAddingSkill && (
              <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#0066CC]/30 space-y-3">
                <h3 className="text-xs font-semibold text-[#1D1D1F]">Add New Verified Skill</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#555555] mb-1">
                      Skill Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Go, GraphQL, Terraform"
                      value={newSkill.name}
                      onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5E5E7] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#555555] mb-1">
                      Category
                    </label>
                    <select
                      value={newSkill.category}
                      onChange={(e) =>
                        setNewSkill({ ...newSkill, category: e.target.value as SkillCategory })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5E5E7] rounded-lg"
                    >
                      {SKILL_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#555555] mb-1">
                      Aliases (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Golang, Go 1.21"
                      value={aliasInput}
                      onChange={(e) => setAliasInput(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5E5E7] rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsAddingSkill(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={addSkill}>
                    Save Skill
                  </Button>
                </div>
              </div>
            )}

            {/* Categorized Skills Display */}
            <div className="space-y-6">
              {SKILL_CATEGORIES.map((cat) => {
                const skillsInCat = profile.skills.filter((s) => s.category === cat);
                if (skillsInCat.length === 0) return null;

                return (
                  <div key={cat} className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0066CC]">
                      {cat} ({skillsInCat.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {skillsInCat.map((skill) => (
                        <div
                          key={skill.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E5E7] rounded-lg text-xs shadow-sm hover:border-[#0071E3] transition-colors"
                        >
                          <button
                            onClick={() => toggleSkillVerified(skill.id)}
                            title={skill.isVerified ? 'Verified by you' : 'Click to verify'}
                          >
                            <CheckCircle2
                              className={`w-3.5 h-3.5 ${
                                skill.isVerified ? 'text-emerald-600' : 'text-[#CCCCCC]'
                              }`}
                            />
                          </button>
                          <span className="font-medium text-[#1D1D1F]">{skill.name}</span>
                          {skill.aliases.length > 0 && (
                            <span className="text-[10px] text-[#777777] bg-[#F5F5F7] px-1.5 py-0.5 rounded">
                              {skill.aliases.join(', ')}
                            </span>
                          )}
                          <button
                            onClick={() => removeSkill(skill.id)}
                            className="text-[#999999] hover:text-red-500 ml-1 transition-colors"
                            title="Remove skill"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Tab 4: Work Experience */}
        {activeTab === 'experience' && (
          <Card className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E7] pb-4">
              <div>
                <h2 className="text-base font-semibold text-[#1D1D1F]">
                  Work Experience & Granular Source Facts
                </h2>
                <p className="text-xs text-[#555555] mt-0.5">
                  Each bullet is stored with a unique, permanent fact ID. Tailored statements cite these IDs to prevent fabrication.
                </p>
              </div>
              <Button
                size="sm"
                pill
                onClick={() => setIsAddingExp(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Experience
              </Button>
            </div>

            {isAddingExp && (
              <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#0066CC]/30 space-y-3">
                <h3 className="text-xs font-semibold text-[#1D1D1F]">Add Work Experience</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#555555] mb-1">Company</label>
                    <input
                      type="text"
                      value={newExp.company}
                      onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5E5E7] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#555555] mb-1">Job Title</label>
                    <input
                      type="text"
                      value={newExp.jobTitle}
                      onChange={(e) => setNewExp({ ...newExp, jobTitle: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5E5E7] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#555555] mb-1">Start Date (YYYY-MM)</label>
                    <input
                      type="text"
                      placeholder="2022-01"
                      value={newExp.startDate}
                      onChange={(e) => setNewExp({ ...newExp, startDate: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5E5E7] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#555555] mb-1">End Date (or Present)</label>
                    <input
                      type="text"
                      placeholder="Present"
                      value={newExp.endDate}
                      onChange={(e) => setNewExp({ ...newExp, endDate: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5E5E7] rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-[#555555] mb-1">
                      Technologies Used (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="Java, Spring Boot, PostgreSQL, Docker"
                      value={expTechInput}
                      onChange={(e) => setExpTechInput(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5E5E7] rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsAddingExp(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={addExperience}>
                    Save Experience
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {profile.experiences.map((exp) => (
                <div
                  key={exp.id}
                  className="p-5 bg-white border border-[#E5E5E7] rounded-xl space-y-4 hover:border-[#0071E3] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E5E7] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-[#1D1D1F]">
                          {exp.jobTitle}
                        </h3>
                        <span className="text-xs text-[#555555]">at</span>
                        <span className="font-semibold text-sm text-[#0066CC]">
                          {exp.company}
                        </span>
                        <Badge variant="available" size="sm">
                          Verified
                        </Badge>
                      </div>
                      <p className="text-xs text-[#555555] mt-0.5">
                        {exp.startDate} – {exp.endDate} • {exp.location} • {exp.employmentType}
                      </p>
                    </div>

                    <button
                      onClick={() => removeExperience(exp.id)}
                      className="text-xs text-red-600 hover:underline flex items-center gap-1 self-start sm:self-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>

                  {/* Technologies */}
                  <div className="flex flex-wrap gap-1.5">
                    {exp.technologies.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] bg-[#F5F5F7] px-2 py-0.5 rounded text-[#1D1D1F] border border-[#E5E5E7]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Responsibilities list */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#555555]">
                      Responsibilities ({exp.responsibilities.length})
                    </h4>
                    <ul className="space-y-2">
                      {exp.responsibilities.map((r) => (
                        <li
                          key={r.id}
                          className="text-xs text-[#333333] flex items-start gap-2 bg-[#FBFBFC] p-2.5 rounded-lg border border-[#E5E5E7]/50"
                        >
                          <span className="text-[#0066CC] font-mono text-[10px] bg-[#F0F7FF] px-1 py-0.5 rounded border border-[#0066CC]/20 shrink-0">
                            {r.id}
                          </span>
                          <span className="leading-relaxed">{r.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Achievements */}
                  {exp.achievements.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                        Achievements ({exp.achievements.length})
                      </h4>
                      <ul className="space-y-2">
                        {exp.achievements.map((a) => (
                          <li
                            key={a.id}
                            className="text-xs text-[#333333] flex items-start gap-2 bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-200/50"
                          >
                            <span className="text-emerald-700 font-mono text-[10px] bg-emerald-100/70 px-1 py-0.5 rounded shrink-0">
                              {a.id}
                            </span>
                            <span className="leading-relaxed">{a.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tab 5: Projects */}
        {activeTab === 'projects' && (
          <Card className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E7] pb-4">
              <div>
                <h2 className="text-base font-semibold text-[#1D1D1F]">
                  Projects & Technical Accomplishments
                </h2>
                <p className="text-xs text-[#555555] mt-0.5">
                  AI selects and prioritizes projects based on technologies requested in the job description.
                </p>
              </div>
              <Button
                size="sm"
                pill
                onClick={() => setIsAddingProj(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Project
              </Button>
            </div>

            {isAddingProj && (
              <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#0066CC]/30 space-y-3">
                <h3 className="text-xs font-semibold text-[#1D1D1F]">Add Project</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#555555] mb-1">Title</label>
                    <input
                      type="text"
                      value={newProj.title}
                      onChange={(e) => setNewProj({ ...newProj, title: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5E5E7] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#555555] mb-1">Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 3 months"
                      value={newProj.duration || ''}
                      onChange={(e) => setNewProj({ ...newProj, duration: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5E5E7] rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-[#555555] mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={newProj.description || ''}
                      onChange={(e) => setNewProj({ ...newProj, description: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5E5E7] rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-[#555555] mb-1">Technologies (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="React.js, Node.js, PostgreSQL"
                      value={projTechInput}
                      onChange={(e) => setProjTechInput(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5E5E7] rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsAddingProj(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={addProject}>
                    Save Project
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {profile.projects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-5 bg-white border border-[#E5E5E7] rounded-xl space-y-3 hover:border-[#0071E3] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E5E7] pb-3">
                    <div>
                      <h3 className="font-semibold text-sm text-[#1D1D1F]">{proj.title}</h3>
                      <p className="text-xs text-[#555555] mt-0.5">{proj.description}</p>
                    </div>
                    <button
                      onClick={() => removeProject(proj.id)}
                      className="text-xs text-red-600 hover:underline flex items-center gap-1 self-start sm:self-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {proj.technologies.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] bg-[#F0F7FF] text-[#0066CC] px-2 py-0.5 rounded border border-[#0066CC]/20"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <ul className="space-y-2 pt-1">
                    {proj.bullets.map((b) => (
                      <li
                        key={b.id}
                        className="text-xs text-[#333333] flex items-start gap-2 bg-[#FBFBFC] p-2 rounded border border-[#E5E5E7]/50"
                      >
                        <span className="text-[#0066CC] font-mono text-[10px] bg-[#F0F7FF] px-1 py-0.5 rounded border border-[#0066CC]/20 shrink-0">
                          {b.id}
                        </span>
                        <span className="leading-relaxed">{b.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tab 6: Education */}
        {activeTab === 'education' && (
          <Card className="space-y-6">
            <div className="border-b border-[#E5E5E7] pb-4">
              <h2 className="text-base font-semibold text-[#1D1D1F]">Education Details</h2>
              <p className="text-xs text-[#555555] mt-0.5">
                Degrees, universities, branches, and graduation years.
              </p>
            </div>

            <div className="space-y-4">
              {profile.education.map((edu) => (
                <div key={edu.id} className="p-4 bg-white border border-[#E5E5E7] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-[#1D1D1F]">
                      {edu.degree} in {edu.branch}
                    </h3>
                    <span className="text-xs text-[#555555]">
                      {edu.startYear} – {edu.graduationYear}
                    </span>
                  </div>
                  <p className="text-xs text-[#0066CC] font-medium">{edu.institution}</p>
                  {edu.cgpaOrPercentage && (
                    <p className="text-xs text-[#555555]">CGPA/Score: {edu.cgpaOrPercentage}</p>
                  )}
                  {edu.additionalInfo && (
                    <p className="text-xs text-[#555555] italic">{edu.additionalInfo}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tab 7: Certifications */}
        {activeTab === 'certifications' && (
          <Card className="space-y-6">
            <div className="border-b border-[#E5E5E7] pb-4">
              <h2 className="text-base font-semibold text-[#1D1D1F]">Certifications & Accreditations</h2>
              <p className="text-xs text-[#555555] mt-0.5">
                Verified industry certifications. The AI will never invent unearned certifications.
              </p>
            </div>

            <div className="space-y-4">
              {profile.certifications.map((cert) => (
                <div key={cert.id} className="p-4 bg-white border border-[#E5E5E7] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-[#1D1D1F]">{cert.name}</h3>
                    <span className="text-xs text-[#555555]">{cert.issueDate}</span>
                  </div>
                  <p className="text-xs text-[#0066CC] font-medium">{cert.issuingOrg}</p>
                  {cert.credentialId && (
                    <p className="text-xs font-mono text-[#555555]">ID: {cert.credentialId}</p>
                  )}
                  {cert.description && (
                    <p className="text-xs text-[#555555]">{cert.description}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
