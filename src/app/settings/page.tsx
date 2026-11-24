'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { repository } from '@/lib/storage/repository';
import { DEFAULT_USER_SETTINGS } from '@/lib/storage/defaultData';
import { UserSettings } from '@/types';
import {
  Settings,
  Sparkles,
  ShieldCheck,
  Database,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Key,
} from 'lucide-react';

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    configured: boolean;
    connected: boolean;
    message: string;
    dbType: string;
  } | null>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSettings(repository.getSettings());
    checkDbConnection();
  }, []);

  const checkDbConnection = async () => {
    setIsCheckingDb(true);
    try {
      const res = await fetch('/api/db/status');
      const data = await res.json();
      setDbStatus(data);
    } catch (e) {
      setDbStatus({
        configured: false,
        connected: false,
        dbType: 'local',
        message: 'Could not connect to database status endpoint.',
      });
    } finally {
      setIsCheckingDb(false);
    }
  };

  const handleSave = () => {
    repository.saveSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handlePurgeData = () => {
    if (
      confirm(
        'CAUTION: This will permanently erase all saved resumes, job descriptions, applications, and reset profile data to defaults. Are you sure?'
      )
    ) {
      repository.purgeAllUserData();
      alert('All user data and generated resumes have been permanently erased.');
      window.location.reload();
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6 w-full max-w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white border border-[#E5E5E7] p-4 sm:p-6 rounded-2xl md:rounded-xl shadow-apple-card max-w-full">
          <div>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#0066CC] shrink-0" />
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#1D1D1F]">
                Application Settings
              </h1>
            </div>
            <p className="text-xs text-[#555555] mt-1 leading-relaxed">
              Configure AI models, privacy filters, and database connectivity.
            </p>
          </div>

          <Button size="sm" pill onClick={handleSave} className="self-start sm:self-auto font-semibold px-4">
            {saveSuccess ? 'Saved!' : 'Save Settings'}
          </Button>
        </div>

        {/* AI Provider Configuration (Module 11) */}
        <Card className="space-y-4">
          <div className="border-b border-[#E5E5E7] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0066CC]" />
              <h2 className="text-sm font-semibold text-[#1D1D1F]">
                Google Gemini AI Integration
              </h2>
            </div>
            <p className="text-xs text-[#555555] mt-0.5">
              ResumeCraft integrates with Google Gemini via the official @google/genai SDK.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#1D1D1F] mb-1">
                AI Provider
              </label>
              <select
                value={settings.aiProvider}
                onChange={(e) =>
                  setSettings({ ...settings, aiProvider: e.target.value as any })
                }
                className="w-full text-xs p-2.5 bg-white border border-[#E5E5E7] rounded-lg"
              >
                <option value="gemini">Google Gemini (@google/genai)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1D1D1F] mb-1">
                Preferred Model
              </label>
              <select
                value={settings.geminiModel}
                onChange={(e) =>
                  setSettings({ ...settings, geminiModel: e.target.value as any })
                }
                className="w-full text-xs p-2.5 bg-white border border-[#E5E5E7] rounded-lg"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended)</option>
                <option value="gemini-2.5-flash">gemini-2.5-flash (Fast & Stable)</option>
                <option value="gemini-1.5-pro">gemini-1.5-pro (Deep Reasoning)</option>
              </select>
            </div>
          </div>

          {/* Secure Environment Setup Instructions */}
          <div className="p-3 bg-[#F5F5F7] rounded-lg border border-[#E5E5E7] text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-medium text-[#1D1D1F]">
              <Key className="w-3.5 h-3.5 text-[#0066CC]" />
              <span>Server-Side API Key Configuration</span>
            </div>
            <p className="text-[#555555] text-[11px] leading-relaxed">
              For security, API keys are kept strictly on the server and never exposed in client browser code. To configure your Gemini API key, add it to your server environment file (<code>.env.local</code>):
            </p>
            <pre className="p-2 bg-white rounded border border-[#E5E5E7] text-[11px] font-mono text-[#0066CC]">
              GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
            </pre>
            <p className="text-[11px] text-[#666666]">
              Note: When no API key is provided, ResumeCraft automatically runs an intelligent, deterministic local rule-based synthesizer that adheres to the exact same schema and factual verification guarantee.
            </p>
          </div>
        </Card>

        {/* Privacy & Consent Requirements (Module 11) */}
        <Card className="space-y-4">
          <div className="border-b border-[#E5E5E7] pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0066CC]" />
              <h2 className="text-sm font-semibold text-[#1D1D1F]">
                Privacy & Data Protection
              </h2>
            </div>
            <p className="text-xs text-[#555555] mt-0.5">
              Strict privacy protocols before sending data to external AI providers.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.anonymizePIIInPrompt}
                onChange={(e) =>
                  setSettings({ ...settings, anonymizePIIInPrompt: e.target.checked })
                }
                className="mt-0.5 rounded text-[#0066CC] focus:ring-[#0071E3]"
              />
              <div>
                <p className="text-xs font-semibold text-[#1D1D1F]">
                  Automatic PII Redaction
                </p>
                <p className="text-[11px] text-[#555555]">
                  Strips candidate name, email, phone number, and personal URLs before prompt submission to the AI model. Personal details are securely restored upon document assembly.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.privacyConsentGiven}
                onChange={(e) =>
                  setSettings({ ...settings, privacyConsentGiven: e.target.checked })
                }
                className="mt-0.5 rounded text-[#0066CC] focus:ring-[#0071E3]"
              />
              <div>
                <p className="text-xs font-semibold text-[#1D1D1F]">
                  AI Processing Consent
                </p>
                <p className="text-[11px] text-[#555555]">
                  I consent to transmitting sanitized professional experience facts and technical skills to the selected AI provider for resume synthesis.
                </p>
              </div>
            </label>
          </div>
        </Card>

        {/* Database & Storage Status (MongoDB & Local Fallback) */}
        <Card className="space-y-4">
          <div className="border-b border-[#E5E5E7] pb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#0066CC]" />
                <h2 className="text-sm font-semibold text-[#1D1D1F]">
                  MongoDB Database Connection
                </h2>
              </div>
              <p className="text-xs text-[#555555] mt-0.5">
                Centralized persistence for profiles, tailored resumes, and applications.
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={checkDbConnection}
              isLoading={isCheckingDb}
            >
              Test Connection
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#FBFBFC] rounded-lg border border-[#E5E5E7] space-y-1">
              <p className="text-[11px] text-[#555555]">Active Database Status</p>
              <div className="flex items-center gap-1.5 mt-1">
                {dbStatus?.connected ? (
                  <Badge variant="available" size="sm">
                    Connected to MongoDB
                  </Badge>
                ) : dbStatus?.configured ? (
                  <Badge variant="warning" size="sm">
                    Configured (Connecting...)
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="sm">
                    Local Storage Repository Mode
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-[#666666] mt-1.5">
                {dbStatus?.message || 'Checking connection...'}
              </p>
            </div>

            <div className="p-3 bg-[#FBFBFC] rounded-lg border border-[#E5E5E7] space-y-1">
              <p className="text-[11px] text-[#555555]">Environment Variable</p>
              <p className="font-mono text-[11px] text-[#0066CC] font-semibold mt-1">
                MONGODB_URI
              </p>
              <p className="text-[11px] text-[#666666]">
                Provide your connection string in <code>.env.local</code>. ResumeCraft automatically handles connection caching and collections.
              </p>
            </div>
          </div>
        </Card>

        {/* Permanent Deletion (Section 14 Security) */}
        <Card className="border-red-200 bg-red-50/20 space-y-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-600" />
            <h3 className="font-semibold text-xs text-red-900">
              Permanent Data Deletion
            </h3>
          </div>
          <p className="text-[11px] text-red-800 leading-relaxed">
            In compliance with security and privacy requirements, you can permanently delete all stored profile facts, uploaded job descriptions, and generated resume documents from this browser session.
          </p>
          <div>
            <Button variant="danger" size="sm" onClick={handlePurgeData}>
              Permanently Delete All User Data
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
