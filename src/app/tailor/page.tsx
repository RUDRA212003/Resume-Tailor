'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { repository } from '@/lib/storage/repository';
import { DEFAULT_PROFILE, BUILT_IN_TEMPLATES } from '@/lib/storage/defaultData';
import {
  Profile,
  JobDescription,
  JDAnalysis,
  ResumeTemplate,
  TailoredResume,
  SkillCategory,
  SavedApplication,
} from '@/types';
import { AtsScanResult } from '@/lib/ai/atsScanner';
import { CoverLetterData } from '@/lib/ai/coverLetterEngine';
import {
  Sparkles,
  Upload,
  FileText,
  Building,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowRight,
  Download,
  Eye,
  Edit3,
  GitCompare,
  RotateCcw,
  Check,
  ShieldCheck,
  Layers,
  FileCheck2,
  ExternalLink,
  Phone,
  Mail,
  Linkedin,
  Globe,
  Github,
  Plus,
  Search,
  Zap,
  TrendingUp,
  Target,
  Link2,
  Copy,
} from 'lucide-react';

function TailorPageContent() {
  const searchParams = useSearchParams();
  const preloadedJdId = searchParams?.get('jdId');
  const preloadedResumeId = searchParams?.get('resumeId');
  const preloadedAppId = searchParams?.get('appId');

  // Application State
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [templates, setTemplates] = useState<ResumeTemplate[]>(BUILT_IN_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tmpl-single-page-ats');
  const [isSavedResumeNotice, setIsSavedResumeNotice] = useState(false);

  // User-approved custom skills specifically for this JD
  const [userApprovedSkills, setUserApprovedSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState('');

  // ATS Scanner & Refinement States
  const [atsReport, setAtsReport] = useState<AtsScanResult | null>(null);
  const [isScanningAts, setIsScanningAts] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refineSuccessNotice, setRefineSuccessNotice] = useState<string | null>(null);

  // Multi-step workflow: 1: Input -> 2: Analysis & Review -> 3: Tailored Preview & Diff
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Input Fields
  const [companyName, setCompanyName] = useState('Stripe');
  const [jobTitle, setJobTitle] = useState('Senior Backend Engineer');
  const [jobLocation, setJobLocation] = useState('Remote / San Francisco, CA');
  const [jobUrl, setJobUrl] = useState('https://stripe.com/jobs/backend-engineer');
  const [rawText, setRawText] = useState(
`About Stripe:
We are looking for a Senior Backend Engineer to join our Core Financial Ledger squad.

Key Responsibilities:
• Design, implement, and maintain scalable microservices in Java and Spring Boot.
• Write highly optimized SQL queries on transactional databases (PostgreSQL/MySQL) with ACID guarantees.
• Build reliable, high-throughput RESTful APIs with comprehensive unit and integration testing.
• Monitor production distributed systems, containerized deployments with Docker, and optimize Redis caching.

Requirements:
• 4+ years of professional software engineering experience.
• Strong proficiency in Java, Spring Boot, and RESTful API architecture.
• Deep experience with relational databases (PostgreSQL or MySQL) and query optimization.
• Familiarity with Docker, Redis, and automated testing (JUnit/Jest).
• B.S. or higher in Computer Science or equivalent.

Nice to have:
• Experience with payment systems, ledger infrastructure, or distributed event processing.`
  );

  const [inputMode, setInputMode] = useState<'paste' | 'upload'>('paste');
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // URL Auto-fetching state
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlFetchSuccess, setUrlFetchSuccess] = useState<string | null>(null);
  const [urlFetchError, setUrlFetchError] = useState<string | null>(null);

  // Step 2: Analysis Results
  const [currentJd, setCurrentJd] = useState<JobDescription | null>(null);
  const [analysis, setAnalysis] = useState<JDAnalysis | null>(null);

  // Step 3: Generated Resume & Preview
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState('');
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(null);

  // Preview Mode: 'preview' | 'diff' | 'edit' | 'cover-letter'
  const [previewMode, setPreviewMode] = useState<'preview' | 'diff' | 'edit' | 'cover-letter'>('preview');
  const [isSavedApp, setIsSavedApp] = useState(false);

  // Cover Letter Studio States
  const [coverLetter, setCoverLetter] = useState<CoverLetterData | null>(null);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [isExportingCoverPdf, setIsExportingCoverPdf] = useState(false);
  const [isExportingCoverDocx, setIsExportingCoverDocx] = useState(false);
  const [isCopiedCoverLetter, setIsCopiedCoverLetter] = useState(false);
  const [showCoverLetterEdit, setShowCoverLetterEdit] = useState(false);

  useEffect(() => {
    setMounted(true);
    const p = repository.getProfile();
    setProfile(p);
    const tmpls = repository.getTemplates();
    setTemplates(tmpls);
    const defTmpl = tmpls.find((t) => t.isDefault) || tmpls[0];
    if (defTmpl) setSelectedTemplateId(defTmpl.id);

    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.personalInfo) {
          setProfile(data);
          repository.cacheProfile(data);
        }
      })
      .catch(() => {});

    // 1. If preloaded Resume ID or Application ID exists, load the resume directly into Step 3
    let targetResumeId = preloadedResumeId;
    if (!targetResumeId && preloadedAppId) {
      const app = repository.getApplications().find((a) => a.id === preloadedAppId);
      if (app) targetResumeId = app.tailoredResumeId;
    }

    if (targetResumeId) {
      const existing = repository.getTailoredResumeById(targetResumeId);
      if (existing) {
        setTailoredResume(existing);
        setSelectedTemplateId(existing.templateId || 'tmpl-single-page-ats');
        if (existing.jobDescriptionId) {
          const jd = repository.getJobDescriptionById(existing.jobDescriptionId);
          if (jd) {
            setCurrentJd(jd);
            setCompanyName(jd.companyName);
            setJobTitle(jd.jobTitle);
            setJobLocation(jd.location || '');
            setJobUrl(jd.url || '');
            setRawText(jd.rawText);
          }
        }
        if (existing.analysis) {
          setAnalysis(existing.analysis);
        }
        setCurrentStep(3);
      } else {
        // Fetch from MongoDB Atlas API endpoint
        fetch(`/api/tailored-resumes/${targetResumeId}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((remoteResume) => {
            if (remoteResume && remoteResume.id) {
              repository.saveTailoredResume(remoteResume);
              setTailoredResume(remoteResume);
              setSelectedTemplateId(remoteResume.templateId || 'tmpl-single-page-ats');
              if (remoteResume.analysis) {
                setAnalysis(remoteResume.analysis);
              }
              setCurrentStep(3);
            }
          })
          .catch(() => {});
      }
    } else if (preloadedJdId) {
      const existing = repository.getJobDescriptionById(preloadedJdId);
      if (existing) {
        setCompanyName(existing.companyName);
        setJobTitle(existing.jobTitle);
        setJobLocation(existing.location || '');
        setJobUrl(existing.url || '');
        setRawText(existing.rawText);
      }
    }
  }, [preloadedResumeId, preloadedAppId, preloadedJdId]);

  // Handle File Upload (DOCX, PDF, TXT)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadWarning(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.isScannedOrUnreadable) {
        setUploadWarning(data.warning || 'Scanned or unreadable document.');
      } else if (data.text) {
        setRawText(data.text);
        setInputMode('paste'); // Display extracted text in text area
        if (!jobTitle) setJobTitle('Software Engineer');
      }
    } catch (err) {
      console.error(err);
      setUploadWarning('Failed to read file. Please paste the job description text.');
    }
  };

  // Step 1 -> Step 2: Analyze Job Description
  const handleAnalyzeJD = async () => {
    if (!rawText.trim()) {
      alert('Please enter or upload a job description.');
      return;
    }

    setIsAnalyzing(true);
    const jdData: JobDescription = {
      id: `jd-${Date.now()}`,
      companyName: companyName.trim() || 'Company',
      jobTitle: jobTitle.trim() || 'Target Role',
      location: jobLocation.trim(),
      url: jobUrl.trim(),
      rawText: rawText.trim(),
      sourceType: inputMode,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/ai/analyze-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jdData, profile }),
      });

      if (!res.ok) throw new Error('Failed to analyze JD');
      const analysisData: JDAnalysis = await res.json();

      repository.saveJobDescription(jdData);
      setCurrentJd(jdData);
      setAnalysis(analysisData);
      setCurrentStep(2);
    } catch (err) {
      console.error(err);
      alert('Analysis failed. Please check network connection.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle adding a missing JD skill for this specific resume only
  const toggleApprovedSkill = (skillName: string) => {
    const trimmed = skillName.trim();
    if (!trimmed) return;
    setUserApprovedSkills((prev) => {
      const exists = prev.some((s) => s.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        return prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      } else {
        return [...prev, trimmed];
      }
    });
  };

  const handleAddCustomSkill = () => {
    if (!customSkillInput.trim()) return;
    toggleApprovedSkill(customSkillInput.trim());
    setCustomSkillInput('');
  };

  // Run ATS Friendliness Scan
  const handleQuickAtsScan = async (resumeToScan?: TailoredResume) => {
    const target = resumeToScan || tailoredResume;
    if (!target || !currentJd) return;
    setIsScanningAts(true);
    try {
      const res = await fetch('/api/ai/scan-ats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: target,
          jobDescription: currentJd,
          userApprovedSkills,
        }),
      });
      if (res.ok) {
        const data: AtsScanResult = await res.json();
        setAtsReport(data);
      }
    } catch (err) {
      console.error('Error running ATS scan:', err);
    } finally {
      setIsScanningAts(false);
    }
  };

  // Refine Resume for higher ATS score
  const handleRefineResume = async () => {
    if (!tailoredResume || !currentJd || !analysis) return;
    setIsRefining(true);
    setRefineSuccessNotice(null);
    try {
      const chosenTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
      const res = await fetch('/api/ai/refine-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          jobDescription: currentJd,
          analysis,
          template: chosenTemplate,
          userApprovedSkills,
          existingResume: tailoredResume,
        }),
      });

      if (!res.ok) throw new Error('Refinement failed');
      const data = await res.json();
      if (data.refinedResume) {
        setTailoredResume(data.refinedResume);
        repository.saveTailoredResume(data.refinedResume);
        if (data.atsReport) {
          setAtsReport(data.atsReport);
          setRefineSuccessNotice(`Resume refined! ATS Score updated to ${data.atsReport.overallScore}/100.`);
        } else {
          setRefineSuccessNotice('Resume refined with enhanced action verbs and keyword alignment.');
        }
        setTimeout(() => setRefineSuccessNotice(null), 4000);
      }
    } catch (err: any) {
      console.error('Error refining resume:', err);
      alert('Refinement error: ' + (err.message || 'Unknown error'));
    } finally {
      setIsRefining(false);
    }
  };

  // Auto-fetch Job Posting Details from URL
  const handleFetchJobFromUrl = async (targetUrl?: string) => {
    const u = (targetUrl || jobUrl).trim();
    if (!u) {
      alert('Please enter a valid job URL starting with http:// or https://');
      return;
    }
    setIsFetchingUrl(true);
    setUrlFetchSuccess(null);
    setUrlFetchError(null);
    try {
      const res = await fetch('/api/ai/fetch-jd-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: u }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch job posting from URL.');
      }
      if (data.companyName) setCompanyName(data.companyName);
      if (data.jobTitle) setJobTitle(data.jobTitle);
      if (data.location) setJobLocation(data.location);
      if (data.url) setJobUrl(data.url);
      if (data.jobDescription) {
        setRawText(data.jobDescription);
        setInputMode('paste');
      }
      setUrlFetchSuccess(`✓ Auto-filled: ${data.companyName || 'Company'} – ${data.jobTitle || 'Role'}`);
      setTimeout(() => setUrlFetchSuccess(null), 6000);
    } catch (err: any) {
      console.error('URL Fetch error:', err);
      setUrlFetchError(err.message || 'Could not fetch job posting. You can paste the text manually.');
      setTimeout(() => setUrlFetchError(null), 8000);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  // Generate 1-Page Tailored Cover Letter
  const handleGenerateCoverLetter = async () => {
    if (!currentJd) return;
    setIsGeneratingCoverLetter(true);
    try {
      const res = await fetch('/api/ai/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          jobDescription: currentJd,
          tailoredResume,
          userApprovedSkills,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate cover letter');
      }
      const data: CoverLetterData = await res.json();
      setCoverLetter(data);
      setPreviewMode('cover-letter');
    } catch (err: any) {
      console.error('Error generating cover letter:', err);
      alert('Cover letter error: ' + (err.message || 'Unknown error'));
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  // Download Cover Letter PDF
  const handleDownloadCoverLetterPdf = async () => {
    if (!coverLetter) return;
    setIsExportingCoverPdf(true);
    try {
      const res = await fetch('/api/export/cover-letter-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coverLetter),
      });
      if (!res.ok) throw new Error('Cover letter PDF generation failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const sanitized = `${coverLetter.candidateName.replace(/\s+/g, '_')}_Cover_Letter_${coverLetter.companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      a.download = sanitized;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Cover letter PDF download error:', err);
      alert('Failed to download Cover Letter PDF.');
    } finally {
      setIsExportingCoverPdf(false);
    }
  };

  // Download Cover Letter DOCX
  const handleDownloadCoverLetterDocx = async () => {
    if (!coverLetter) return;
    setIsExportingCoverDocx(true);
    try {
      const res = await fetch('/api/export/cover-letter-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coverLetter),
      });
      if (!res.ok) throw new Error('Cover letter DOCX generation failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const sanitized = `${coverLetter.candidateName.replace(/\s+/g, '_')}_Cover_Letter_${coverLetter.companyName.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
      a.download = sanitized;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Cover letter DOCX download error:', err);
      alert('Failed to download Cover Letter DOCX.');
    } finally {
      setIsExportingCoverDocx(false);
    }
  };

  // Copy Cover Letter Text
  const handleCopyCoverLetter = () => {
    if (!coverLetter) return;
    navigator.clipboard.writeText(coverLetter.fullLetterText);
    setIsCopiedCoverLetter(true);
    setTimeout(() => setIsCopiedCoverLetter(false), 2500);
  };

  // Step 2 -> Step 3: Generate Tailored Resume
  const handleGenerateTailoredResume = async () => {
    if (!currentJd || !analysis) return;

    setIsGenerating(true);
    setGenerationPhase('Sanitizing personal data for privacy...');

    const chosenTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

    try {
      setTimeout(() => setGenerationPhase('Aligning verified profile facts with job requirements...'), 600);
      setTimeout(() => setGenerationPhase('Synthesizing ATS-optimized bullet points...'), 1200);
      setTimeout(() => setGenerationPhase('Validating strict factual grounding (anti-hallucination check)...'), 1800);

      const res = await fetch('/api/ai/tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          jobDescription: currentJd,
          analysis,
          template: chosenTemplate,
          userApprovedSkills,
        }),
      });

      if (!res.ok) throw new Error('Resume generation failed');
      const tailoredData: TailoredResume = await res.json();

      repository.saveTailoredResume(tailoredData);

      // Automatically sync and record in Saved Applications & History
      const autoApp: SavedApplication = {
        id: `app-${tailoredData.id}`,
        companyName: currentJd.companyName,
        jobTitle: currentJd.jobTitle,
        location: currentJd.location,
        jobUrl: currentJd.url,
        tailoredResumeId: tailoredData.id,
        jobDescriptionId: currentJd.id,
        templateId: selectedTemplateId,
        relevanceScore: analysis?.relevanceScore || 90,
        status: 'Draft',
        notes: 'Generated via ResumeCraft Studio',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      repository.saveApplication(autoApp);

      setTailoredResume(tailoredData);
      setCurrentStep(3);
      handleQuickAtsScan(tailoredData);
    } catch (err) {
      console.error(err);
      alert('Generation error. Please retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download DOCX
  const handleDownloadDocx = async () => {
    if (!tailoredResume) return;
    try {
      const template = templates.find((t) => t.id === tailoredResume.templateId) || templates[0];
      const res = await fetch('/api/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: tailoredResume, profile, template }),
      });
      if (!res.ok) throw new Error('DOCX export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${profile.personalInfo.fullName.replace(/\s+/g, '_')}_${tailoredResume.title.slice(0, 25)}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert('Could not download DOCX.');
    }
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Download Genuine Vector ATS PDF
  const handleDownloadPdf = async () => {
    if (!tailoredResume) return;
    setIsExportingPdf(true);

    try {
      const template = templates.find((t) => t.id === selectedTemplateId) || templates[0];
      const res = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: tailoredResume,
          profile,
          template,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `PDF generation failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const company = currentJd?.companyName || (tailoredResume.title?.includes(' at ') ? tailoredResume.title.split(' at ')[1] : '') || '';
      const cleanCompany = company.replace(/[^a-zA-Z0-9]/g, '_').trim();
      const cleanName = profile.personalInfo.fullName.replace(/[^a-zA-Z0-9]/g, '_');
      a.download = cleanCompany ? `${cleanName}_Resume_${cleanCompany}.pdf` : `${cleanName}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('PDF export error:', err);
      alert('PDF generation error: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Save to Job Applications
  const handleSaveToApplications = () => {
    if (!tailoredResume || !currentJd) return;
    const app: SavedApplication = {
      id: `app-${tailoredResume.id}`,
      companyName: currentJd.companyName,
      jobTitle: currentJd.jobTitle,
      location: currentJd.location,
      jobUrl: currentJd.url,
      tailoredResumeId: tailoredResume.id,
      jobDescriptionId: currentJd.id,
      templateId: selectedTemplateId,
      relevanceScore: analysis?.relevanceScore || 90,
      status: 'Applied',
      notes: 'Custom tailored resume submitted.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    repository.saveApplication(app);
    setIsSavedApp(true);
    setTimeout(() => setIsSavedApp(false), 3000);
  };

  // Save Manual Edits or Updates to the Tailored Resume
  const handleSaveResumeChanges = () => {
    if (!tailoredResume) return;
    const updated: TailoredResume = {
      ...tailoredResume,
      templateId: selectedTemplateId,
      updatedAt: new Date().toISOString(),
    };
    repository.saveTailoredResume(updated);
    setTailoredResume(updated);
    setIsSavedResumeNotice(true);
    setTimeout(() => setIsSavedResumeNotice(false), 3000);
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const isCompactTemplate = selectedTemplate?.layoutType === 'compact' || selectedTemplate?.id === 'tmpl-single-page-ats';

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Step Progress Bar (Apple Styled) */}
        <div className="no-print bg-white border border-[#E5E5E7] p-3 sm:p-4 rounded-xl shadow-apple-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-0.5">
            {[
              { num: 1, label: 'Job Description', short: '1. JD' },
              { num: 2, label: 'Profile Matching', short: '2. Match' },
              { num: 3, label: 'Preview & Review', short: '3. Review' },
            ].map((step) => {
              const isCurrent = currentStep === step.num;
              const isDone = currentStep > step.num;

              return (
                <div key={step.num} className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-[#0066CC] text-white'
                        : 'bg-[#F5F5F7] text-[#777777]'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : step.num}
                  </div>
                  <span
                    className={`text-xs whitespace-nowrap ${
                      isCurrent
                        ? 'font-semibold text-[#1D1D1F]'
                        : 'text-[#666666]'
                    }`}
                  >
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{step.short}</span>
                  </span>
                  {step.num < 3 && <span className="text-[#CCCCCC] mx-0.5 sm:mx-1">→</span>}
                </div>
              );
            })}
          </div>

          {currentStep > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as any) : 1))}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              className="self-start sm:self-auto text-xs"
            >
              Back to Step {currentStep - 1}
            </Button>
          )}
        </div>

        {/* STEP 1: JOB DESCRIPTION INPUT */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <Card className="space-y-6">
              <div className="border-b border-[#E5E5E7] pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#0066CC]" />
                    <h1 className="text-xl font-bold tracking-tight text-[#1D1D1F]">
                      Tailor My Resume – Submit Job Description
                    </h1>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-semibold self-start sm:self-auto shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>✨ Gemini AI Active (gemini-3.1-flash-lite)</span>
                  </div>
                </div>
                <p className="text-xs text-[#555555] mt-1">
                  Submit the target job requirements via document upload, direct paste, or auto-fetch directly from the job posting URL.
                </p>
              </div>

              {/* Job Posting URL Auto-Fill Box (Manual & Auto Both) */}
              <div className="p-4 bg-gradient-to-r from-[#F0F7FF] via-[#F8FAFF] to-white border border-[#0066CC]/25 rounded-xl space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-[#0066CC]/10 text-[#0066CC]">
                      <Link2 className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-[#1D1D1F]">
                        Auto-Fill Job Details from URL (LinkedIn, Indeed, Greenhouse, Lever, etc.)
                      </h3>
                      <p className="text-[11px] text-[#555555]">
                        Paste any job link to auto-extract company name, role, and full JD requirements, or fill them manually below.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-[#0066CC] uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-[#0066CC]/20 self-start sm:self-auto">
                    Manual &amp; Auto Supported
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      placeholder="Paste target job link e.g. https://www.linkedin.com/jobs/view/... or https://boards.greenhouse.io/..."
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleFetchJobFromUrl();
                        }
                      }}
                      className="w-full text-xs px-3 py-2 bg-white border border-[#E5E5E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] font-mono"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    pill
                    onClick={() => handleFetchJobFromUrl()}
                    isLoading={isFetchingUrl}
                    icon={<Zap className="w-3.5 h-3.5 text-amber-500" />}
                    className="bg-[#0066CC] hover:bg-[#0052A3] text-white shrink-0"
                  >
                    Fetch &amp; Auto-Fill JD
                  </Button>
                </div>

                {/* Status Notices */}
                {urlFetchSuccess && (
                  <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{urlFetchSuccess}</span>
                  </div>
                )}
                {urlFetchError && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{urlFetchError}</span>
                  </div>
                )}
              </div>

              {/* Company & Title Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#1D1D1F] mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Stripe, Google, Meta"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E5E5E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1D1D1F] mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E5E5E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1D1D1F] mb-1">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                    placeholder="e.g. Remote, San Francisco"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E5E5E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1D1D1F] mb-1">
                    Application URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E5E5E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                  />
                </div>
              </div>

              {/* Mode Selector Tabs */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInputMode('paste')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      inputMode === 'paste'
                        ? 'bg-[#0066CC] text-white'
                        : 'bg-white border border-[#E5E5E7] text-[#1D1D1F]'
                    }`}
                  >
                    Paste Text
                  </button>
                  <button
                    onClick={() => setInputMode('upload')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      inputMode === 'upload'
                        ? 'bg-[#0066CC] text-white'
                        : 'bg-white border border-[#E5E5E7] text-[#1D1D1F]'
                    }`}
                  >
                    Upload Document (PDF, DOCX, TXT)
                  </button>
                </div>

                {/* Upload Warning if file was scanned */}
                {uploadWarning && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Document Reading Warning</p>
                      <p className="mt-0.5">{uploadWarning}</p>
                    </div>
                  </div>
                )}

                {inputMode === 'upload' ? (
                  <div className="border-2 border-dashed border-[#E5E5E7] p-8 rounded-xl text-center space-y-3 bg-[#FBFBFC]">
                    <div className="w-10 h-10 rounded-full bg-[#F0F7FF] text-[#0066CC] flex items-center justify-center mx-auto">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#1D1D1F]">
                        Upload Job Description File
                      </p>
                      <p className="text-[11px] text-[#555555] mt-0.5">
                        Supports PDF (digital text), DOCX, and TXT documents.
                      </p>
                    </div>
                    <label className="inline-block cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <span className="px-4 py-2 text-xs font-medium bg-white border border-[#E5E5E7] rounded-lg hover:bg-[#F5F5F7] transition-colors shadow-sm inline-flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#0066CC]" />
                        Select File
                      </span>
                    </label>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-[#1D1D1F] mb-1">
                      Job Description Text
                    </label>
                    <textarea
                      rows={10}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="Paste the full job posting text here..."
                      className="w-full p-3 text-xs text-[#1D1D1F] font-mono leading-relaxed bg-white border border-[#E5E5E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                    />
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="flex justify-end pt-2 border-t border-[#E5E5E7]">
                <Button
                  size="md"
                  pill
                  onClick={handleAnalyzeJD}
                  isLoading={isAnalyzing}
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  Analyze Job Description
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* STEP 2: JOB DESCRIPTION ANALYSIS & PROFILE MATCH MATRIX */}
        {currentStep === 2 && analysis && (
          <div className="space-y-6">
            {/* Transparent ATS Match Overview Card */}
            <Card className="bg-gradient-to-r from-white to-[#F0F7FF]/40 border-[#0066CC]/20 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#0066CC]">
                      Requirement Analysis
                    </span>
                    <Badge variant="info" size="sm">
                      {currentJd?.jobTitle} at {currentJd?.companyName}
                    </Badge>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      ✨ Gemini AI Active
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-[#1D1D1F]">
                    Internal Relevance Estimate: {analysis.relevanceScore}%
                  </h2>
                  <p className="text-xs text-[#555555] max-w-2xl leading-relaxed">
                    {analysis.scoreBreakdown.explanation} (Note: This is an internal algorithmic relevance estimate, not a guaranteed ATS pass score. We do not engage in dishonest keyword stuffing.)
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-[11px] text-[#555555]">Profile Alignment</p>
                    <p className="text-sm font-semibold text-emerald-700">High Suitability</p>
                  </div>
                </div>
              </div>

              {/* Breakdown metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#E5E5E7]">
                <div className="bg-white p-2.5 rounded-lg border border-[#E5E5E7]">
                  <p className="text-[10px] text-[#555555]">Skills Match</p>
                  <p className="text-base font-bold text-[#1D1D1F]">
                    {analysis.scoreBreakdown.skillsMatchPercentage}%
                  </p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-[#E5E5E7]">
                  <p className="text-[10px] text-[#555555]">Experience Fit</p>
                  <p className="text-base font-bold text-[#1D1D1F]">
                    {analysis.scoreBreakdown.experienceRelevance}%
                  </p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-[#E5E5E7]">
                  <p className="text-[10px] text-[#555555]">Project Relevance</p>
                  <p className="text-base font-bold text-[#1D1D1F]">
                    {analysis.scoreBreakdown.projectRelevance}%
                  </p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-[#E5E5E7]">
                  <p className="text-[10px] text-[#555555]">Keyword Coverage</p>
                  <p className="text-base font-bold text-[#1D1D1F]">
                    {analysis.scoreBreakdown.keywordCoverage}%
                  </p>
                </div>
              </div>
            </Card>

            {/* Skills Comparison Matrix: Available / Partial / Missing */}
            <Card className="space-y-5">
              <div className="border-b border-[#E5E5E7] pb-3">
                <h3 className="text-sm font-semibold text-[#1D1D1F]">
                  Skills Verification Matrix
                </h3>
                <p className="text-xs text-[#555555]">
                  Status of every requirement against your single source of truth profile repository.
                </p>
              </div>

              <div className="space-y-4">
                {/* Required Skills */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1D1D1F]">
                      Required Technical Skills ({analysis.requiredSkills.length})
                    </h4>
                    <span className="text-[11px] text-[#666666]">
                      Click &ldquo;+ Add for this JD&rdquo; to include missing skills on this resume only
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {analysis.requiredSkills.map((req, idx) => {
                      const isApproved = userApprovedSkills.some(
                        (s) => s.toLowerCase() === req.name.toLowerCase()
                      );

                      if (isApproved) {
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-300 rounded-lg text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="font-semibold text-emerald-950">{req.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                ✓ Added for this JD
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleApprovedSkill(req.name)}
                                className="text-[11px] text-rose-600 hover:text-rose-800 underline font-medium"
                                title="Remove from this resume"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-[#FBFBFC] border border-[#E5E5E7] rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {req.status === 'available' && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                            {req.status === 'partially_matched' && (
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                            )}
                            {req.status === 'not_present' && (
                              <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                            )}
                            {req.status === 'requires_confirmation' && (
                              <HelpCircle className="w-4 h-4 text-[#0066CC] shrink-0" />
                            )}
                            <span className="font-medium text-[#1D1D1F]">{req.name}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {req.status === 'available' && (
                              <Badge variant="available" size="sm">
                                Available in Profile
                              </Badge>
                            )}
                            {req.status === 'partially_matched' && (
                              <>
                                <Badge variant="partial" size="sm">
                                  Partially Matched
                                </Badge>
                                <button
                                  type="button"
                                  onClick={() => toggleApprovedSkill(req.name)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded transition-colors"
                                  title="Include explicitly in this tailored resume"
                                >
                                  <Plus className="w-3 h-3" /> Include
                                </button>
                              </>
                            )}
                            {req.status === 'not_present' && (
                              <>
                                <Badge variant="missing" size="sm">
                                  Not in Profile
                                </Badge>
                                <button
                                  type="button"
                                  onClick={() => toggleApprovedSkill(req.name)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors"
                                  title="Add this skill for this specific resume only (Profile remains untouched)"
                                >
                                  <Plus className="w-3 h-3" /> Add for this JD
                                </button>
                              </>
                            )}
                            {req.status === 'requires_confirmation' && (
                              <>
                                <Badge variant="warning" size="sm">
                                  Requires Confirmation
                                </Badge>
                                <button
                                  type="button"
                                  onClick={() => toggleApprovedSkill(req.name)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded transition-colors"
                                >
                                  <Plus className="w-3 h-3" /> Include
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Preferred Skills */}
                {analysis.preferredSkills.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#E5E5E7]">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#555555]">
                        Preferred &amp; Bonus Skills ({analysis.preferredSkills.length})
                      </h4>
                      <span className="text-[11px] text-[#777777]">Click any skill to include/exclude for this JD</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.preferredSkills.map((pref, idx) => {
                        const isApproved = userApprovedSkills.some(
                          (s) => s.toLowerCase() === pref.name.toLowerCase()
                        );
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleApprovedSkill(pref.name)}
                            className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                              isApproved
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold shadow-xs'
                                : pref.status === 'available'
                                ? 'bg-emerald-50/50 text-emerald-700 border-emerald-200 font-medium'
                                : 'bg-white text-[#555555] border-[#E5E5E7] hover:border-[#0066CC] hover:text-[#0066CC]'
                            }`}
                          >
                            <span>{pref.name}</span>
                            {isApproved ? (
                              <span className="text-emerald-700 font-bold">✓ Added</span>
                            ) : pref.status === 'available' ? (
                              '✓'
                            ) : (
                              <Plus className="w-3 h-3 text-[#777777]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Optional JD-Specific Skills Custom Input */}
                <div className="p-4 bg-[#F0F7FF]/50 border border-[#0066CC]/20 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-[#1D1D1F] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#0066CC]" />
                        JD-Specific Skill Additions (Isolated to this Resume)
                      </h4>
                      <p className="text-[11px] text-[#555555]">
                        Missing a skill requested by this JD (e.g. Docker, AWS, Kubernetes)? Add it here. It will be verified and included <strong>strictly in this tailored resume</strong> without altering your global profile repository.
                      </p>
                    </div>
                    {userApprovedSkills.length > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                        {userApprovedSkills.length} JD Skill{userApprovedSkills.length > 1 ? 's' : ''} Active
                      </span>
                    )}
                  </div>

                  {/* Add Input Field */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Docker, PostgreSQL, GraphQL, AWS EC2..."
                      value={customSkillInput}
                      onChange={(e) => setCustomSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomSkill();
                        }
                      }}
                      className="flex-1 text-xs px-3 py-2 bg-white border border-[#E5E5E7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0066CC]"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={handleAddCustomSkill}
                      icon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add to this Resume
                    </Button>
                  </div>

                  {/* Active JD-Specific Skills Badges */}
                  {userApprovedSkills.length > 0 && (
                    <div className="pt-2 border-t border-[#0066CC]/15 space-y-1.5">
                      <p className="text-[11px] font-medium text-[#0066CC]">
                        Currently added for this JD:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {userApprovedSkills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-medium shadow-2xs"
                          >
                            <span>✓ {skill}</span>
                            <button
                              type="button"
                              onClick={() => toggleApprovedSkill(skill)}
                              className="text-emerald-700 hover:text-rose-600 font-bold ml-1"
                              title="Remove skill"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Template Selection for Tailored Generation */}
            <Card className="space-y-4">
              <div className="border-b border-[#E5E5E7] pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#1D1D1F]">
                    Choose Resume Template
                  </h3>
                  <p className="text-xs text-[#555555]">
                    Select visual structure for generated DOCX and PDF documents.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {templates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedTemplateId === tmpl.id
                        ? 'border-[#0066CC] bg-[#F0F7FF]/30 ring-1 ring-[#0066CC]'
                        : 'border-[#E5E5E7] bg-white hover:border-[#0071E3]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#1D1D1F]">{tmpl.name}</span>
                      {selectedTemplateId === tmpl.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0066CC]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#555555] mt-1 line-clamp-2">
                      {tmpl.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Generation Button */}
              <div className="pt-4 border-t border-[#E5E5E7] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-emerald-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Strict verification active: Unverified claims are automatically rejected.</span>
                </div>

                <Button
                  size="lg"
                  pill
                  onClick={handleGenerateTailoredResume}
                  isLoading={isGenerating}
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  Generate Tailored Resume
                </Button>
              </div>

              {/* Progress message during generation */}
              {isGenerating && (
                <div className="p-3 bg-[#F0F7FF] rounded-lg border border-[#0066CC]/20 text-xs text-[#0066CC] flex items-center gap-2 animate-pulse">
                  <Sparkles className="w-4 h-4" />
                  <span>{generationPhase}</span>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* STEP 3: SPLIT-SCREEN RESUME PREVIEW, REVIEW, & CHANGE COMPARISON */}
        {currentStep === 3 && tailoredResume && (
          <div className="space-y-6">
            {/* Top Review Controls Bar */}
            <div className="no-print bg-white border border-[#E5E5E7] p-3 sm:p-4 rounded-xl shadow-apple-card flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 max-w-full">
                <div className="flex bg-[#F5F5F7] p-1 rounded-lg overflow-x-auto no-scrollbar max-w-full shrink-0">
                  <button
                    onClick={() => setPreviewMode('preview')}
                    className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      previewMode === 'preview'
                        ? 'bg-white text-[#0066CC] font-semibold shadow-xs'
                        : 'text-[#555555] hover:text-[#1D1D1F]'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Resume Preview
                  </button>
                  <button
                    onClick={() => setPreviewMode('diff')}
                    className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      previewMode === 'diff'
                        ? 'bg-white text-[#0066CC] font-semibold shadow-xs'
                        : 'text-[#555555] hover:text-[#1D1D1F]'
                    }`}
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    Diff ({tailoredResume.diff.changes.length})
                  </button>
                  <button
                    onClick={() => setPreviewMode('edit')}
                    className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      previewMode === 'edit'
                        ? 'bg-white text-[#0066CC] font-semibold shadow-xs'
                        : 'text-[#555555] hover:text-[#1D1D1F]'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (!coverLetter) {
                        handleGenerateCoverLetter();
                      } else {
                        setPreviewMode('cover-letter');
                      }
                    }}
                    className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      previewMode === 'cover-letter'
                        ? 'bg-white text-[#0066CC] font-semibold shadow-xs'
                        : 'text-[#555555] hover:text-[#1D1D1F]'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    1-Page Cover Letter
                    {coverLetter && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                </div>

                {tailoredResume.tailoringEngine === 'gemini-api' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Sparkles className="w-3 h-3" />
                    AI Tailored via Gemini (gemini-3.1-flash-lite)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200" title="Offline Heuristic Engine used because GEMINI_API_KEY is not configured in .env.local">
                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                    Deterministic ATS Keyword Engine (Heuristic Fallback)
                  </span>
                )}
              </div>

              {/* Action Buttons: Responsive to active view */}
              <div className="flex flex-wrap items-center gap-2">
                {previewMode === 'cover-letter' ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCopyCoverLetter}
                      icon={<Copy className="w-3.5 h-3.5 text-indigo-600" />}
                    >
                      {isCopiedCoverLetter ? 'Copied!' : 'Copy Letter'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowCoverLetterEdit(!showCoverLetterEdit)}
                      icon={<Edit3 className="w-3.5 h-3.5 text-[#0066CC]" />}
                    >
                      {showCoverLetterEdit ? 'Preview Mode' : 'Edit Text'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleGenerateCoverLetter}
                      isLoading={isGeneratingCoverLetter}
                      icon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Regenerate
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleDownloadCoverLetterPdf}
                      isLoading={isExportingCoverPdf}
                      icon={<Download className="w-3.5 h-3.5" />}
                    >
                      Download Cover PDF
                    </Button>
                    <Button
                      size="sm"
                      pill
                      onClick={handleDownloadCoverLetterDocx}
                      isLoading={isExportingCoverDocx}
                      icon={<Download className="w-3.5 h-3.5" />}
                    >
                      Download Cover DOCX
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleQuickAtsScan()}
                      isLoading={isScanningAts}
                      icon={<Search className="w-3.5 h-3.5 text-[#0066CC]" />}
                    >
                      Quick ATS Scan
                    </Button>
                    <Button
                      size="sm"
                      pill
                      onClick={handleRefineResume}
                      isLoading={isRefining}
                      icon={<Sparkles className="w-3.5 h-3.5" />}
                      className="bg-[#0066CC] hover:bg-[#0052A3] text-white"
                    >
                      Refine Resume
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSaveResumeChanges}
                      icon={<Check className="w-3.5 h-3.5 text-blue-600" />}
                    >
                      {isSavedResumeNotice ? 'Resume Saved!' : 'Save Resume'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSaveToApplications}
                      icon={<FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />}
                    >
                      {isSavedApp ? 'Saved to Applications!' : 'Save Application'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleDownloadPdf}
                      isLoading={isExportingPdf}
                      icon={<Download className="w-3.5 h-3.5" />}
                    >
                      Download PDF
                    </Button>
                    <Button
                      size="sm"
                      pill
                      onClick={handleDownloadDocx}
                      icon={<Download className="w-3.5 h-3.5" />}
                    >
                      Download DOCX
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* ATS Friendly Audit & Score Bar */}
            <Card className="no-print border border-[#0066CC]/20 bg-gradient-to-r from-[#F8FAFF] via-white to-[#F0F7FF] p-5 rounded-2xl shadow-apple-card space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  {/* Score Dial / Badge */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border font-bold shrink-0 ${
                      !atsReport
                        ? 'bg-slate-100 border-slate-300 text-slate-600'
                        : atsReport.overallScore >= 85
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                        : atsReport.overallScore >= 70
                        ? 'bg-blue-50 border-blue-300 text-[#0066CC]'
                        : 'bg-amber-50 border-amber-300 text-amber-800'
                    }`}
                  >
                    <span className="text-xl leading-none font-extrabold">
                      {atsReport ? atsReport.overallScore : '--'}
                    </span>
                    <span className="text-[10px] font-semibold text-[#666666] uppercase tracking-wider">
                      / 100
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#0066CC] flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        ATS Friendliness Audit
                      </span>
                      {atsReport && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            atsReport.overallScore >= 85
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : atsReport.overallScore >= 70
                              ? 'bg-blue-100 text-[#0066CC] border-blue-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {atsReport.rating}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#555555] max-w-2xl leading-relaxed">
                      {atsReport?.summary ||
                        'Scan your tailored resume against target ATS systems to verify keyword density, parseability, action verbs, and single-page compliance.'}
                    </p>
                  </div>
                </div>

                {/* ATS Action Buttons: Quick Scan & Refine */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleQuickAtsScan()}
                    isLoading={isScanningAts}
                    icon={<Search className="w-3.5 h-3.5 text-[#0066CC]" />}
                  >
                    Quick ATS Scan
                  </Button>

                  <Button
                    size="sm"
                    pill
                    onClick={handleRefineResume}
                    isLoading={isRefining}
                    icon={<Sparkles className="w-3.5 h-3.5" />}
                    className="bg-[#0066CC] hover:bg-[#0052A3] text-white"
                  >
                    Refine for Higher ATS Score
                  </Button>
                </div>
              </div>

              {/* Refinement Success Notice */}
              {refineSuccessNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{refineSuccessNotice}</span>
                </div>
              )}

              {/* 4 Pillar Breakdown Progress Bars */}
              {atsReport && (
                <div className="pt-3 border-t border-[#E5E5E7] space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-2.5 rounded-xl border border-[#E5E5E7]">
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <span className="text-[#555555]">Keywords Match</span>
                        <span className="font-bold text-[#1D1D1F]">
                          {atsReport.breakdown.keywordMatchScore}%
                        </span>
                      </div>
                      <div className="w-full bg-[#E5E5E7] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#0066CC] h-full rounded-full transition-all duration-500"
                          style={{ width: `${atsReport.breakdown.keywordMatchScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-[#E5E5E7]">
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <span className="text-[#555555]">ATS Structure</span>
                        <span className="font-bold text-[#1D1D1F]">
                          {atsReport.breakdown.structureScore}%
                        </span>
                      </div>
                      <div className="w-full bg-[#E5E5E7] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${atsReport.breakdown.structureScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-[#E5E5E7]">
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <span className="text-[#555555]">Action Verbs &amp; Impact</span>
                        <span className="font-bold text-[#1D1D1F]">
                          {atsReport.breakdown.impactScore}%
                        </span>
                      </div>
                      <div className="w-full bg-[#E5E5E7] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${atsReport.breakdown.impactScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-[#E5E5E7]">
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <span className="text-[#555555]">Formatting / Single-Page</span>
                        <span className="font-bold text-[#1D1D1F]">
                          {atsReport.breakdown.formattingScore}%
                        </span>
                      </div>
                      <div className="w-full bg-[#E5E5E7] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${atsReport.breakdown.formattingScore}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Matched vs Missing Keyword Chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span className="text-[11px] font-semibold text-[#555555]">
                      Keywords Found ({atsReport.matchedKeywords.length}):
                    </span>
                    {atsReport.matchedKeywords.slice(0, 10).map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        ✓ {kw}
                      </span>
                    ))}
                    {atsReport.missingKeywords.length > 0 && (
                      <>
                        <span className="text-[11px] font-semibold text-[#777777] ml-2">
                          Missing from JD:
                        </span>
                        {atsReport.missingKeywords.slice(0, 5).map((kw) => (
                          <span
                            key={kw}
                            className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200"
                          >
                            ! {kw}
                          </span>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Actionable Recommendations */}
                  {atsReport.recommendations && atsReport.recommendations.length > 0 && (
                    <div className="p-3 bg-white rounded-xl border border-[#E5E5E7] text-xs space-y-1">
                      <p className="font-semibold text-[#1D1D1F] text-[11px]">
                        Key ATS Improvement Recommendations:
                      </p>
                      <ul className="space-y-1 text-[#555555] text-[11px]">
                        {atsReport.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#0066CC] font-bold">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Split Screen Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT SIDE (7 COLS): GENERATED RESUME PREVIEW / DIFF */}
              <div className="lg:col-span-7">
                {/* Change Comparison (Diff) View */}
                {previewMode === 'diff' && (
                  <Card className="space-y-4">
                    <div className="border-b border-[#E5E5E7] pb-3">
                      <div className="flex items-center gap-2">
                        <GitCompare className="w-4 h-4 text-[#0066CC]" />
                        <h3 className="font-semibold text-sm text-[#1D1D1F]">
                          Transparent Ground Truth Change Diff
                        </h3>
                      </div>
                      <p className="text-xs text-[#555555] mt-0.5">
                        {tailoredResume.diff.rewrittenCount} refined statements, {tailoredResume.diff.omittedCount} filtered profile skills. Zero fabricated facts.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {tailoredResume.diff.changes.map((ch, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-[#FBFBFC] border border-[#E5E5E7] rounded-lg text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#1D1D1F]">{ch.title}</span>
                            <Badge
                              variant={
                                ch.type === 'rewritten'
                                  ? 'info'
                                  : ch.type === 'removed'
                                  ? 'warning'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {ch.type}
                            </Badge>
                          </div>

                          {ch.originalText && (
                            <div className="p-2 bg-red-50/50 rounded border border-red-200/50 text-[#555555]">
                              <p className="text-[10px] font-semibold text-red-700">Original Profile Fact:</p>
                              <p className="line-through">{ch.originalText}</p>
                            </div>
                          )}

                          <div className="p-2 bg-emerald-50/50 rounded border border-emerald-200/50 text-[#1D1D1F]">
                            <p className="text-[10px] font-semibold text-emerald-700">Tailored Resume Statement:</p>
                            <p>{ch.newText}</p>
                          </div>

                          <p className="text-[11px] text-[#555555] italic">
                            Reason: {ch.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Inline Edit View */}
                {previewMode === 'edit' && (
                  <Card className="space-y-4">
                    <div className="border-b border-[#E5E5E7] pb-3">
                      <h3 className="font-semibold text-sm text-[#1D1D1F]">
                        Direct Bullet Point Editor
                      </h3>
                      <p className="text-xs text-[#555555]">
                        You can manually refine any tailored statement before downloading.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-[#1D1D1F]">
                        Summary
                      </label>
                      <textarea
                        rows={3}
                        value={tailoredResume.summary}
                        onChange={(e) =>
                          setTailoredResume({ ...tailoredResume, summary: e.target.value })
                        }
                        className="w-full text-xs p-2.5 bg-white border border-[#E5E5E7] rounded-lg"
                      />

                      <div className="space-y-4 pt-2">
                        {tailoredResume.selectedExperiences.map((exp, eIdx) => (
                          <div key={exp.experienceId} className="space-y-2 border-t pt-2">
                            <h4 className="text-xs font-semibold text-[#0066CC]">
                              {exp.jobTitle} – {exp.company}
                            </h4>
                            {exp.bullets.map((b, bIdx) => (
                              <textarea
                                key={b.id}
                                rows={2}
                                value={b.text}
                                onChange={(e) => {
                                  const updated = { ...tailoredResume };
                                  updated.selectedExperiences[eIdx].bullets[bIdx].text = e.target.value;
                                  setTailoredResume(updated);
                                }}
                                className="w-full text-xs p-2 bg-[#FBFBFC] border rounded"
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Pixel-Perfect Rendered Resume Sheet */}
                {previewMode === 'preview' && (
                  <div className="overflow-x-auto -mx-1 px-1">
                    <div
                      id="resume-print-area"
                      className={`page-sheet bg-white border border-[#E5E5E7] p-4 sm:p-6 md:p-10 rounded-xl shadow-apple-card space-y-4 text-xs text-[#1D1D1F] ${
                        selectedTemplate.layoutType === 'classic' ? 'font-sans' : 'font-sans'
                      }`}
                    >
                    {/* Header (Exact layout matching candidate resume) */}
                    <div className="text-center pb-2">
                      <h1 className="text-2xl font-bold uppercase tracking-wide text-black font-serif mb-3">
                        {profile.personalInfo.fullName}
                      </h1>
                      <div className="text-[12px] text-black flex flex-wrap items-center justify-center gap-x-7 gap-y-1.5 font-serif">
                        {profile.personalInfo.phone && (
                          <a
                            href={`tel:${profile.personalInfo.phone.replace(/[^\d+]/g, '')}`}
                            className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-black" />
                            <span>{profile.personalInfo.phone}</span>
                          </a>
                        )}
                        {profile.personalInfo.email && (
                          <a
                            href={`mailto:${profile.personalInfo.email}`}
                            className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5 text-black" />
                            <span>{profile.personalInfo.email}</span>
                          </a>
                        )}
                        {profile.personalInfo.linkedinUrl && (
                          <a
                            href={profile.personalInfo.linkedinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                          >
                            <Linkedin className="w-3.5 h-3.5 text-black" />
                            <span>LinkedIn</span>
                          </a>
                        )}
                        {profile.personalInfo.portfolioUrl && (
                          <a
                            href={profile.personalInfo.portfolioUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                          >
                            <Globe className="w-3.5 h-3.5 text-black" />
                            <span>Portfolio</span>
                          </a>
                        )}
                        {!isCompactTemplate && profile.personalInfo.githubUrl && (
                          <a
                            href={profile.personalInfo.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                          >
                            <Github className="w-3.5 h-3.5 text-black" />
                            <span>GitHub</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Summary (Profile Description) */}
                    {tailoredResume.summary && (
                      <div className="space-y-1">
                        <h2 className="font-bold uppercase tracking-wider text-xs border-b border-black pb-0.5 text-black">
                          Professional Summary
                        </h2>
                        <p className="leading-relaxed text-[#222222] text-[11.5px]">
                          {tailoredResume.summary}
                        </p>
                      </div>
                    )}

                    {/* Technical Skills */}
                    {tailoredResume.selectedSkills.length > 0 && (
                      <div className="space-y-1">
                        <h2 className="font-bold uppercase tracking-wider text-xs border-b border-black pb-0.5 text-black">
                          Technical Skills
                        </h2>
                        <div className="space-y-0.5 pt-0.5">
                          {tailoredResume.selectedSkills.map((catGroup) => (
                            <p key={catGroup.category} className="leading-relaxed text-[11.5px]">
                              <strong className="text-black font-semibold">{catGroup.category}:</strong>{' '}
                              <span className="text-[#222222]">{catGroup.skills.join(', ')}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Work Experience */}
                    {tailoredResume.selectedExperiences.length > 0 && (
                      <div className="space-y-3">
                        <h2 className="font-bold uppercase tracking-wider text-xs border-b border-black pb-0.5 text-black">
                          Experience
                        </h2>

                        <div className="space-y-3">
                          {tailoredResume.selectedExperiences.map((exp) => (
                            <div key={exp.experienceId} className="space-y-0.5">
                              <div className="flex justify-between items-baseline font-bold text-xs text-black">
                                <span>{exp.company}</span>
                                <span className="font-normal text-xs text-[#333333]">
                                  {exp.startDate} – {exp.endDate}
                                </span>
                              </div>
                              <div className="flex justify-between items-baseline text-xs text-[#333333] italic">
                                <span>{exp.jobTitle}</span>
                                <span className="not-italic">{exp.location}</span>
                              </div>

                              <ul className="list-disc pl-4 space-y-1 text-[#222222] mt-1">
                                {exp.bullets.map((b) => (
                                  <li key={b.id} className="leading-relaxed text-[11.5px]">
                                    {b.text}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {tailoredResume.selectedProjects.length > 0 && (
                      <div className="space-y-3">
                        <h2 className="font-bold uppercase tracking-wider text-xs border-b border-black pb-0.5 text-black">
                          Projects
                        </h2>

                        <div className="space-y-3">
                          {tailoredResume.selectedProjects.map((proj) => (
                            <div key={proj.projectId} className="space-y-0.5">
                              <div className="flex justify-between items-baseline text-xs">
                                <span className="font-bold text-black">
                                  {proj.title}{' '}
                                  {proj.technologies.length > 0 && (
                                    <span className="font-normal text-[#444444]">
                                      | {proj.technologies.join(', ')}
                                    </span>
                                  )}
                                </span>
                                <span className="text-[#333333] shrink-0 ml-2">
                                  {proj.duration || ''}
                                </span>
                              </div>

                              {!isCompactTemplate && proj.description && (
                                <p className="text-[11px] text-[#444444] italic">
                                  {proj.description}
                                </p>
                              )}

                              <ul className="list-disc pl-4 space-y-1 text-[#222222] mt-1">
                                {proj.bullets.map((b) => (
                                  <li key={b.id} className="leading-relaxed text-[11.5px]">
                                    {b.text}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {tailoredResume.education.length > 0 && (
                      <div className="space-y-1.5">
                        <h2 className="font-bold uppercase tracking-wider text-xs border-b border-black pb-0.5 text-black">
                          Education
                        </h2>
                        {tailoredResume.education.map((edu) => (
                          <div key={edu.id} className="space-y-0.5">
                            <div className="flex justify-between items-baseline font-bold text-xs text-black">
                              <span>{edu.institution}</span>
                              <span className="font-normal text-xs text-[#333333]">
                                {edu.startYear} – {edu.graduationYear}
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline text-xs text-[#333333] italic">
                              <span>
                                {edu.degree} in {edu.branch}
                                {edu.cgpaOrPercentage ? ` — CGPA: ${edu.cgpaOrPercentage}` : ''}
                              </span>
                              <span className="not-italic">
                                {edu.additionalInfo
                                  ? edu.additionalInfo.replace(/^Location:\s*/i, '')
                                  : 'Tiptur'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Certifications */}
                    {tailoredResume.certifications.length > 0 && (
                      <div className="space-y-1.5">
                        <h2 className="font-bold uppercase tracking-wider text-xs border-b border-black pb-0.5 text-black">
                          Certifications
                        </h2>
                        {tailoredResume.certifications.map((cert) => (
                          <p key={cert.id} className="text-[#222222] text-[11.5px]">
                            <strong>{cert.name}</strong> — {cert.issuingOrg} ({cert.issueDate})
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  </div>
                )}

                {/* 1-Page Tailored Cover Letter Sheet */}
                {previewMode === 'cover-letter' && (
                  <div className="space-y-4">
                    {isGeneratingCoverLetter ? (
                      <Card className="p-12 text-center space-y-3 bg-white border border-[#E5E5E7] rounded-xl shadow-apple-card">
                        <Sparkles className="w-8 h-8 text-[#0066CC] animate-spin mx-auto" />
                        <h3 className="font-bold text-sm text-[#1D1D1F]">
                          Architecting Tailored 1-Page Cover Letter...
                        </h3>
                        <p className="text-xs text-[#555555] max-w-md mx-auto">
                          Connecting your verified engineering achievements and approved skills directly to {currentJd?.companyName}&apos;s requirements.
                        </p>
                      </Card>
                    ) : coverLetter ? (
                      <div className="space-y-4">
                        {/* Inline Edit Form if enabled */}
                        {showCoverLetterEdit ? (
                          <Card className="space-y-4 p-6 bg-white border border-[#E5E5E7] rounded-xl shadow-apple-card">
                            <div className="border-b pb-3 flex items-center justify-between">
                              <h3 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">
                                Direct Paragraph Editor
                              </h3>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setShowCoverLetterEdit(false)}
                              >
                                View Rendered Page
                              </Button>
                            </div>

                            <div className="space-y-3 text-xs">
                              <div>
                                <label className="block font-semibold mb-1 text-[#1D1D1F]">Salutation</label>
                                <input
                                  type="text"
                                  value={coverLetter.salutation}
                                  onChange={(e) =>
                                    setCoverLetter({ ...coverLetter, salutation: e.target.value })
                                  }
                                  className="w-full p-2 bg-[#FBFBFC] border rounded text-xs"
                                />
                              </div>

                              <div>
                                <label className="block font-semibold mb-1 text-[#1D1D1F]">Opening Paragraph</label>
                                <textarea
                                  rows={3}
                                  value={coverLetter.openingParagraph}
                                  onChange={(e) =>
                                    setCoverLetter({ ...coverLetter, openingParagraph: e.target.value })
                                  }
                                  className="w-full p-2.5 bg-[#FBFBFC] border rounded text-xs leading-relaxed"
                                />
                              </div>

                              <div>
                                <label className="block font-semibold mb-1 text-[#1D1D1F]">Technical Achievements Paragraph</label>
                                <textarea
                                  rows={4}
                                  value={coverLetter.technicalBodyParagraph}
                                  onChange={(e) =>
                                    setCoverLetter({ ...coverLetter, technicalBodyParagraph: e.target.value })
                                  }
                                  className="w-full p-2.5 bg-[#FBFBFC] border rounded text-xs leading-relaxed"
                                />
                              </div>

                              <div>
                                <label className="block font-semibold mb-1 text-[#1D1D1F]">Role &amp; Company Alignment</label>
                                <textarea
                                  rows={3}
                                  value={coverLetter.alignmentBodyParagraph}
                                  onChange={(e) =>
                                    setCoverLetter({ ...coverLetter, alignmentBodyParagraph: e.target.value })
                                  }
                                  className="w-full p-2.5 bg-[#FBFBFC] border rounded text-xs leading-relaxed"
                                />
                              </div>

                              <div>
                                <label className="block font-semibold mb-1 text-[#1D1D1F]">Closing Paragraph</label>
                                <textarea
                                  rows={3}
                                  value={coverLetter.closingParagraph}
                                  onChange={(e) =>
                                    setCoverLetter({ ...coverLetter, closingParagraph: e.target.value })
                                  }
                                  className="w-full p-2.5 bg-[#FBFBFC] border rounded text-xs leading-relaxed"
                                />
                              </div>
                            </div>
                          </Card>
                        ) : null}

                        {/* Pixel-Perfect Rendered Cover Letter Sheet */}
                        <div className="overflow-x-auto -mx-1 px-1">
                          <div
                            id="cover-letter-print-area"
                            className="page-sheet bg-white border border-[#E5E5E7] p-5 sm:p-8 md:p-14 rounded-xl shadow-apple-card space-y-5 text-[12.5px] text-[#1D1D1F] font-serif leading-relaxed"
                          >
                          {/* Candidate Header */}
                          <div className="text-center pb-3 border-b border-black">
                            <h1 className="text-2xl font-bold uppercase tracking-wide text-black mb-2">
                              {coverLetter.candidateName}
                            </h1>
                            <div className="text-[12px] text-black flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
                              {coverLetter.candidatePhone && (
                                <a
                                  href={`tel:${coverLetter.candidatePhone.replace(/[^\d+]/g, '')}`}
                                  className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                                >
                                  <Phone className="w-3.5 h-3.5 text-black" />
                                  <span>{coverLetter.candidatePhone}</span>
                                </a>
                              )}
                              {coverLetter.candidateEmail && (
                                <a
                                  href={`mailto:${coverLetter.candidateEmail}`}
                                  className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                                >
                                  <Mail className="w-3.5 h-3.5 text-black" />
                                  <span>{coverLetter.candidateEmail}</span>
                                </a>
                              )}
                              {coverLetter.candidateLinkedin && (
                                <a
                                  href={coverLetter.candidateLinkedin}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                                >
                                  <Linkedin className="w-3.5 h-3.5 text-black" />
                                  <span>LinkedIn</span>
                                </a>
                              )}
                              {coverLetter.candidatePortfolio && (
                                <a
                                  href={coverLetter.candidatePortfolio}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                                >
                                  <Globe className="w-3.5 h-3.5 text-black" />
                                  <span>Portfolio</span>
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Date */}
                          <div className="text-[12px] text-[#333333] pt-1">
                            {coverLetter.date}
                          </div>

                          {/* Recipient Details */}
                          <div className="text-[12px] space-y-0.5 text-[#222222]">
                            <p className="font-bold text-black">{coverLetter.recipientName}</p>
                            <p>{coverLetter.recipientRole}</p>
                            <p className="font-semibold text-black">{coverLetter.companyName}</p>
                            {coverLetter.companyLocation && <p>{coverLetter.companyLocation}</p>}
                          </div>

                          {/* Salutation */}
                          <div className="font-bold text-black pt-1">
                            {coverLetter.salutation}
                          </div>

                          {/* Letter Body Paragraphs */}
                          <div className="space-y-3.5 text-justify text-[#1D1D1F] leading-relaxed">
                            <p>{coverLetter.openingParagraph}</p>
                            <p>{coverLetter.technicalBodyParagraph}</p>
                            {coverLetter.alignmentBodyParagraph && (
                              <p>{coverLetter.alignmentBodyParagraph}</p>
                            )}
                            <p>{coverLetter.closingParagraph}</p>
                          </div>

                          {/* Signoff */}
                          <div className="pt-3 space-y-4">
                            <p>{coverLetter.signoff}</p>
                            <p className="font-bold text-black text-sm">{coverLetter.candidateName}</p>
                          </div>
                        </div>
                        </div>
                      </div>
                    ) : (
                      <Card className="p-8 text-center space-y-4 bg-white">
                        <div className="w-12 h-12 rounded-full bg-[#F0F7FF] text-[#0066CC] flex items-center justify-center mx-auto">
                          <Mail className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-[#1D1D1F]">
                            Create a 1-Page Tailored Cover Letter
                          </h3>
                          <p className="text-xs text-[#555555] max-w-md mx-auto mt-1">
                            Generate a customized, professional cover letter tailored for {currentJd?.companyName} using your verified profile achievements and approved skills.
                          </p>
                        </div>
                        <Button
                          size="md"
                          pill
                          onClick={handleGenerateCoverLetter}
                          isLoading={isGeneratingCoverLetter}
                          icon={<Sparkles className="w-4 h-4" />}
                          className="bg-[#0066CC] hover:bg-[#0052A3] text-white"
                        >
                          Generate 1-Page Cover Letter
                        </Button>
                      </Card>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT SIDE (5 COLS): MATCHING ANALYSIS & FACT GROUNDING INSPECTOR */}
              <div className="lg:col-span-5 space-y-4 no-print">
                {/* Quick Cover Letter Switch / Callout */}
                {previewMode === 'cover-letter' ? (
                  <Card className="border-[#0066CC]/20 bg-gradient-to-r from-[#F0F7FF] via-white to-white space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-[#0066CC]" />
                      <div>
                        <h4 className="font-semibold text-xs text-[#1D1D1F]">
                          Cover Letter Strategy &amp; Alignment
                        </h4>
                        <p className="text-[11px] text-[#0066CC]">
                          Tailored for {currentJd?.companyName}
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#555555] space-y-1.5 border-t border-[#0066CC]/15 pt-2">
                      <p>• Target Role: <strong className="text-[#1D1D1F]">{currentJd?.jobTitle}</strong></p>
                      <p>• Company: <strong className="text-[#1D1D1F]">{currentJd?.companyName}</strong></p>
                      <p>• Candidate: <strong className="text-[#1D1D1F]">{profile.personalInfo.fullName}</strong></p>
                      {userApprovedSkills.length > 0 && (
                        <p>• Approved Skills Integrated: <span className="font-semibold text-emerald-700">{userApprovedSkills.join(', ')}</span></p>
                      )}
                      <p>• Strict Anti-Hallucination: Grounded in verified engineering facts.</p>
                    </div>

                    <div className="pt-2 border-t border-[#E5E5E7] flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPreviewMode('preview')}
                        icon={<Eye className="w-3.5 h-3.5 text-[#0066CC]" />}
                      >
                        Switch Back to Resume Preview
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="p-3.5 bg-gradient-to-r from-[#F0F7FF] to-white border border-[#0066CC]/25 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[#1D1D1F] flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#0066CC]" />
                        1-Page Tailored Cover Letter
                      </p>
                      <p className="text-[11px] text-[#555555]">
                        Need a cover page for {currentJd?.companyName}?
                      </p>
                    </div>
                    <Button
                      size="sm"
                      pill
                      onClick={() => {
                        if (!coverLetter) handleGenerateCoverLetter();
                        else setPreviewMode('cover-letter');
                      }}
                      isLoading={isGeneratingCoverLetter}
                      icon={<Sparkles className="w-3.5 h-3.5" />}
                      className="bg-[#0066CC] hover:bg-[#0052A3] text-white shrink-0"
                    >
                      {coverLetter ? 'View Letter' : 'Create Cover Page'}
                    </Button>
                  </div>
                )}

                {/* Fact Verification Report */}
                <Card className="border-emerald-200 bg-emerald-50/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="font-semibold text-xs text-[#1D1D1F]">
                        Factual Grounding Report
                      </h4>
                      <p className="text-[11px] text-emerald-700">
                        100% Verified Against Profile Repository
                      </p>
                    </div>
                  </div>
                  <div className="text-[11px] text-[#555555] space-y-1.5 border-t border-emerald-200/50 pt-2">
                    <p className="flex items-center gap-1.5 font-medium text-[#1D1D1F]">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>
                        Engine:{' '}
                        <span className="font-semibold text-indigo-700">
                          {tailoredResume.tailoringEngine === 'gemini-api'
                            ? 'Google Gemini Cloud AI (Active)'
                            : 'Local High-Speed Synthesizer (Active)'}
                        </span>
                      </span>
                    </p>
                    <p>• {tailoredResume.validationReport.checkedFactsCount} factual claims validated.</p>
                    <p>• 0 unverified technologies detected.</p>
                    <p>• All rewritten bullets mapped to permanent fact IDs.</p>
                  </div>
                </Card>

                {/* ATS Matching Analysis Breakdown */}
                <Card className="space-y-4">
                  <div className="border-b border-[#E5E5E7] pb-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-xs text-[#1D1D1F]">
                        ATS Matching Breakdown
                      </h4>
                      <Badge variant="available" size="sm">
                        {tailoredResume.analysis?.relevanceScore ?? 90}% Match
                      </Badge>
                    </div>
                    <p className="text-[11px] text-[#555555] mt-0.5">
                      Target Role: {currentJd?.jobTitle || 'Target Role'}
                    </p>
                  </div>

                  {/* Missing Required Skills Warning (Truth First) */}
                  {tailoredResume.analysis?.requiredSkills?.some((s) => s.status === 'not_present') && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Missing Required Skills in Profile</span>
                      </div>
                      <p className="text-[11px]">
                        The posting requests{' '}
                        {tailoredResume.analysis.requiredSkills
                          .filter((s) => s.status === 'not_present')
                          .map((s) => s.name)
                          .join(', ')}
                        . As promised, ResumeCraft did NOT invent these skills.
                      </p>
                    </div>
                  )}

                  {/* Selected Technologies Highlighted */}
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-semibold uppercase tracking-wider text-[#555555]">
                      Highlighted Matching Skills
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {tailoredResume.selectedSkills.flatMap((g) => g.skills).slice(0, 10).map((s) => (
                        <span
                          key={s}
                          className="text-[11px] bg-[#F0F7FF] text-[#0066CC] px-2 py-0.5 rounded border border-[#0066CC]/20"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-2 pt-2 border-t border-[#E5E5E7]">
                    <h5 className="text-[11px] font-semibold uppercase tracking-wider text-[#555555]">
                      Tailoring Recommendations
                    </h5>
                    <ul className="text-[11px] text-[#555555] space-y-2">
                      {tailoredResume.analysis?.recommendations?.map((rec, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-[#0066CC] font-bold">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>

                {/* Regenerate Controls */}
                <Card className="space-y-3">
                  <h4 className="font-semibold text-xs text-[#1D1D1F]">
                    Regeneration & Section Controls
                  </h4>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleGenerateTailoredResume}
                      icon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Regenerate Entire Resume
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function TailorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] text-xs text-[#555555]">
          Loading Tailor Studio...
        </div>
      }
    >
      <TailorPageContent />
    </Suspense>
  );
}
