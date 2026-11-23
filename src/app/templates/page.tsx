'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { repository } from '@/lib/storage/repository';
import { BUILT_IN_TEMPLATES } from '@/lib/storage/defaultData';
import { ResumeTemplate, TemplateLayoutType } from '@/types';
import {
  Layers,
  Upload,
  CheckCircle2,
  Trash2,
  Edit2,
  FileCheck,
  Check,
  Eye,
} from 'lucide-react';

export default function TemplatesPage() {
  const [mounted, setMounted] = useState(false);
  const [templates, setTemplates] = useState<ResumeTemplate[]>(BUILT_IN_TEMPLATES);
  const [selectedPreview, setSelectedPreview] = useState<ResumeTemplate | null>(BUILT_IN_TEMPLATES[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ResumeTemplate | null>(null);

  useEffect(() => {
    setMounted(true);
    const list = repository.getTemplates();
    setTemplates(list);
    setSelectedPreview(list.find((t) => t.isDefault) || list[0]);
  }, []);

  const handleSetDefault = (id: string) => {
    const updated = repository.setDefaultTemplate(id);
    setTemplates(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this custom template?')) {
      const ok = repository.deleteTemplate(id);
      if (ok) {
        const list = repository.getTemplates();
        setTemplates(list);
        if (selectedPreview?.id === id) {
          setSelectedPreview(list[0]);
        }
      }
    }
  };

  const handleUploadDocxTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setTimeout(() => {
      const newTemplate: ResumeTemplate = {
        id: `tmpl-custom-${Date.now()}`,
        name: file.name.replace(/\.docx$/i, ''),
        description: 'User-uploaded custom Microsoft Word template with preserved section styling.',
        layoutType: 'modern',
        isBuiltIn: false,
        isDefault: false,
        accentColor: '#0066CC',
        fontFamily: 'Inter, -apple-system, sans-serif',
        sectionsOrder: ['summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
        createdAt: new Date().toISOString(),
      };

      repository.saveTemplate(newTemplate);
      const list = repository.getTemplates();
      setTemplates(list);
      setSelectedPreview(newTemplate);
      setIsUploading(false);
    }, 600);
  };

  const handleSaveSectionsOrder = () => {
    if (!editingTemplate) return;
    repository.saveTemplate(editingTemplate);
    setTemplates(repository.getTemplates());
    setEditingTemplate(null);
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#E5E5E7] p-6 rounded-xl shadow-apple-card">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#0066CC]" />
              <h1 className="text-xl font-bold tracking-tight text-[#1D1D1F]">
                Resume Templates Management
              </h1>
            </div>
            <p className="text-xs text-[#555555] mt-1 max-w-2xl">
              Select or upload ATS-compliant DOCX resume templates. The selected template determines section ordering, typographic hierarchy, font families, and margins.
            </p>
          </div>

          <div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".docx"
                className="hidden"
                onChange={handleUploadDocxTemplate}
                disabled={isUploading}
              />
              <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#0066CC] text-white rounded-lg hover:bg-[#0055b3] transition-colors shadow-sm">
                <Upload className="w-3.5 h-3.5" />
                {isUploading ? 'Uploading...' : 'Upload DOCX Template'}
              </span>
            </label>
          </div>
        </div>

        {/* Templates Grid & Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Templates List (8 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-sm font-semibold text-[#1D1D1F]">
              Available Templates ({templates.length})
            </h2>

            <div className="space-y-3">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedPreview(tmpl)}
                  className={`p-5 rounded-xl border cursor-pointer transition-all ${
                    selectedPreview?.id === tmpl.id
                      ? 'border-[#0066CC] bg-[#F0F7FF]/20 shadow-apple-card ring-1 ring-[#0066CC]'
                      : 'border-[#E5E5E7] bg-white hover:border-[#0071E3]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#1D1D1F]">
                          {tmpl.name}
                        </span>
                        {tmpl.isDefault && (
                          <Badge variant="available" size="sm">
                            Default
                          </Badge>
                        )}
                        {tmpl.isBuiltIn ? (
                          <Badge variant="neutral" size="sm">
                            Built-in
                          </Badge>
                        ) : (
                          <Badge variant="info" size="sm">
                            Custom
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[#555555] leading-relaxed">
                        {tmpl.description}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {!tmpl.isDefault && (
                        <button
                          onClick={() => handleSetDefault(tmpl.id)}
                          className="text-xs text-[#0066CC] hover:underline font-medium px-2 py-1"
                        >
                          Make Default
                        </button>
                      )}
                      <button
                        onClick={() => setEditingTemplate(tmpl)}
                        className="text-xs text-[#555555] hover:text-[#1D1D1F] p-1.5 rounded hover:bg-[#F5F5F7]"
                        title="Configure Sections"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!tmpl.isBuiltIn && (
                        <button
                          onClick={() => handleDelete(tmpl.id)}
                          className="text-xs text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50"
                          title="Delete Template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#E5E5E7]/60 flex items-center justify-between text-[11px] text-[#555555]">
                    <span>Font: {tmpl.fontFamily.split(',')[0]}</span>
                    <span>Sections: {tmpl.sectionsOrder.join(' → ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Template Preview Simulator (5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-20">
              <Card className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E5E7] pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#0066CC]" />
                    <h3 className="font-semibold text-xs text-[#1D1D1F]">
                      Template Visual Simulation
                    </h3>
                  </div>
                  <span className="text-[11px] font-medium text-[#555555]">
                    {selectedPreview?.name}
                  </span>
                </div>

                {/* Simulated Mini-Resume Sheet */}
                <div className="bg-white border border-[#E5E5E7] p-5 rounded-lg shadow-sm font-sans space-y-3 text-[10px]">
                  {/* Header */}
                  <div
                    className={
                      selectedPreview?.layoutType === 'classic'
                        ? 'text-center border-b pb-2'
                        : 'border-b pb-2 text-left'
                    }
                  >
                    <p className="font-bold text-xs text-[#1D1D1F]">RUDRESH M</p>
                    <p className="text-[#666666] text-[9px] mt-0.5">
                      Bangalore, India • +91 6364152219 • rudreshmanjunath15@gmail.com
                    </p>
                  </div>

                  {/* Render simulated sections in configured order */}
                  {selectedPreview?.sectionsOrder.map((section) => {
                    const isClassic = selectedPreview?.layoutType === 'classic';
                    const accentStyle = { color: selectedPreview?.accentColor || '#0066CC' };

                    if (section === 'summary') {
                      return (
                        <div key="summary" className="space-y-0.5">
                          <p
                            className={`font-semibold uppercase tracking-wider text-[9px] ${
                              isClassic ? 'text-center border-b pb-0.5' : ''
                            }`}
                            style={!isClassic ? accentStyle : undefined}
                          >
                            Professional Summary
                          </p>
                          <p className="text-[#444444] text-[9px] leading-relaxed">
                            Full-Stack Engineer with 4+ years building high-throughput microservices using Java, Spring Boot, React.js, and PostgreSQL.
                          </p>
                        </div>
                      );
                    }

                    if (section === 'skills') {
                      return (
                        <div key="skills" className="space-y-0.5">
                          <p
                            className={`font-semibold uppercase tracking-wider text-[9px] ${
                              isClassic ? 'text-center border-b pb-0.5' : ''
                            }`}
                            style={!isClassic ? accentStyle : undefined}
                          >
                            Technical Skills
                          </p>
                          <p className="text-[#333333] text-[9px]">
                            <strong>Languages:</strong> Java, TypeScript, SQL, Python
                          </p>
                          <p className="text-[#333333] text-[9px]">
                            <strong>Frameworks:</strong> Spring Boot, React.js, Next.js, Node.js
                          </p>
                        </div>
                      );
                    }

                    if (section === 'experience') {
                      return (
                        <div key="experience" className="space-y-1">
                          <p
                            className={`font-semibold uppercase tracking-wider text-[9px] ${
                              isClassic ? 'text-center border-b pb-0.5' : ''
                            }`}
                            style={!isClassic ? accentStyle : undefined}
                          >
                            Professional Experience
                          </p>
                          <div className="space-y-0.5">
                            <div className="flex justify-between font-medium text-[9px]">
                              <span>Senior Software Engineer – Apex Cloud</span>
                              <span className="text-[#666666]">2023 – Present</span>
                            </div>
                            <p className="text-[#444444] text-[8.5px] pl-2 border-l border-[#E5E5E7]">
                              • Engineered payment gateway microservices handling 2.5M daily transactions.
                            </p>
                          </div>
                        </div>
                      );
                    }

                    if (section === 'projects') {
                      return (
                        <div key="projects" className="space-y-1">
                          <p
                            className={`font-semibold uppercase tracking-wider text-[9px] ${
                              isClassic ? 'text-center border-b pb-0.5' : ''
                            }`}
                            style={!isClassic ? accentStyle : undefined}
                          >
                            Key Projects
                          </p>
                          <p className="text-[9px] font-medium text-[#1D1D1F]">
                            PayStream – Distributed Ledger Engine
                          </p>
                          <p className="text-[#444444] text-[8.5px] pl-2 border-l border-[#E5E5E7]">
                            • Double-entry bookkeeping system with optimistic locking in Java.
                          </p>
                        </div>
                      );
                    }

                    if (section === 'education') {
                      return (
                        <div key="education" className="space-y-0.5">
                          <p
                            className={`font-semibold uppercase tracking-wider text-[9px] ${
                              isClassic ? 'text-center border-b pb-0.5' : ''
                            }`}
                            style={!isClassic ? accentStyle : undefined}
                          >
                            Education
                          </p>
                          <div className="flex justify-between text-[9px]">
                            <span>B.S. Computer Science – UC Davis</span>
                            <span className="text-[#666666]">2021</span>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Section Config Modal */}
        {editingTemplate && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full space-y-4">
              <h3 className="font-semibold text-sm text-[#1D1D1F]">
                Configure Template: {editingTemplate.name}
              </h3>
              <p className="text-xs text-[#555555]">
                Adjust section ordering for this template layout.
              </p>

              <div className="space-y-2">
                {editingTemplate.sectionsOrder.map((sec, idx) => (
                  <div
                    key={sec}
                    className="flex items-center justify-between p-2 bg-[#F5F5F7] rounded text-xs"
                  >
                    <span className="font-medium capitalize">{sec}</span>
                    <div className="flex items-center gap-1">
                      <button
                        disabled={idx === 0}
                        onClick={() => {
                          const order = [...editingTemplate.sectionsOrder];
                          const temp = order[idx - 1];
                          order[idx - 1] = order[idx];
                          order[idx] = temp;
                          setEditingTemplate({ ...editingTemplate, sectionsOrder: order });
                        }}
                        className="px-2 py-0.5 text-xs bg-white border rounded disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        disabled={idx === editingTemplate.sectionsOrder.length - 1}
                        onClick={() => {
                          const order = [...editingTemplate.sectionsOrder];
                          const temp = order[idx + 1];
                          order[idx + 1] = order[idx];
                          order[idx] = temp;
                          setEditingTemplate({ ...editingTemplate, sectionsOrder: order });
                        }}
                        className="px-2 py-0.5 text-xs bg-white border rounded disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingTemplate(null)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveSectionsOrder}>
                  Save Configuration
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
